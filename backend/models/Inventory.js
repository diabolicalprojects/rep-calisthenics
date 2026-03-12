import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Bebidas', 'Suplementos', 'Ropa', 'Accesorios', 'Otros']
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        default: 'Disponible',
        enum: ['Disponible', 'Poco Stock', 'Agotado']
    }
}, { timestamps: true });

export default mongoose.model('Inventory', inventorySchema);
