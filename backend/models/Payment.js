import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    memberName: { type: String, required: true },
    concept: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Pagado', 'Pendiente'], default: 'Pendiente' },
    date: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);
