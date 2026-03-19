import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { InventorySchema } from '../validators/schemas.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/inventory
 * Lista todos los artículos del inventario ordenados por nombre.
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM inventory ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/inventory
 * Agrega un nuevo artículo al inventario con validación Zod.
 */
router.post('/', async (req, res) => {
  try {
    const validated = InventorySchema.parse(req.body);
    const result = await query(
      'INSERT INTO inventory (name, price, quantity, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [validated.name, validated.price, validated.quantity, validated.category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error creating inventory item:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/inventory/:id
 * Actualiza la cantidad de un artículo del inventario.
 */
router.put('/:id', async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || isNaN(Number(quantity))) {
    return res.status(400).json({ error: 'La cantidad es requerida y debe ser un número' });
  }
  try {
    const result = await query(
      'UPDATE inventory SET quantity=$1, last_update=NOW() WHERE id=$2 RETURNING *',
      [quantity, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/inventory/:id
 * Elimina un artículo del inventario.
 */
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
