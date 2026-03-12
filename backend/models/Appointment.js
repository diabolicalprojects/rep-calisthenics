import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    memberName: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: String, default: '1 hr' },
    status: { type: String, enum: ['Pendiente', 'Confirmada', 'Cancelada'], default: 'Pendiente' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Appointment', appointmentSchema);
