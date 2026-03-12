import express from 'express';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// Obtener todo el inventario
router.get('/', async (req, res) => {
    try {
        const items = await Inventory.find().sort({ createdAt: -1 });
        // Actualizar el estado si se cambia la cantidad manualmente (ej: por debajo de 5)
        const updatedItems = items.map(item => {
            if (item.quantity <= 0) item.status = 'Agotado';
            else if (item.quantity <= 5) item.status = 'Poco Stock';
            else item.status = 'Disponible';
            return item;
        });
        res.json(updatedItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Agregar nuevo insumo
router.post('/', async (req, res) => {
    const item = new Inventory({
        name: req.body.name,
        category: req.body.category,
        quantity: req.body.quantity,
        price: req.body.price,
    });

    if (item.quantity <= 0) item.status = 'Agotado';
    else if (item.quantity <= 5) item.status = 'Poco Stock';
    else item.status = 'Disponible';

    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Aumentar o disminuir stock
router.put('/:id/stock', async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item no encontrado' });

        item.quantity = req.body.quantity !== undefined ? req.body.quantity : item.quantity;

        if (item.quantity <= 0) item.status = 'Agotado';
        else if (item.quantity <= 5) item.status = 'Poco Stock';
        else item.status = 'Disponible';

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item no encontrado' });
        res.json({ message: 'Item eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
