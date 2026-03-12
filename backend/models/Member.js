import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    plan: { type: String, enum: ['Mensual', 'Anual', 'Elite'], default: 'Mensual' },
    status: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Member', memberSchema);
