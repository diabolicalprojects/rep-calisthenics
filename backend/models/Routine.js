import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    level: { type: String, enum: ['Principiante', 'Intermedio', 'Avanzado'], required: true },
    focus: { type: String, required: true },
    icon: { type: String, default: '🔥' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Routine', routineSchema);
