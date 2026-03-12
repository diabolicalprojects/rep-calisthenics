import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';
import Routine from './models/Routine.js';
import Payment from './models/Payment.js';
import Appointment from './models/Appointment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rep-calisthenics';

const runSeed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado a MongoDB para sembrar datos...');

        // Limpiar BD
        await Member.deleteMany({});
        await Routine.deleteMany({});
        await Payment.deleteMany({});
        await Appointment.deleteMany({});

        console.log('Colecciones limpiadas.');

        // Crear Miembros
        const members = await Member.insertMany([
            { name: 'Miguel Torres', email: 'miguel.t@mail.com', phone: '555-1234', plan: 'Anual', status: 'Activo' },
            { name: 'Carla Ruiz', email: 'carla.r@mail.com', phone: '555-5678', plan: 'Elite', status: 'Activo' },
            { name: 'Daniel Romo', email: 'd.romo@mail.com', phone: '555-9012', plan: 'Mensual', status: 'Inactivo' },
            { name: 'Laura Medina', email: 'l.medina@mail.com', phone: '555-3344', plan: 'Mensual', status: 'Activo' },
            { name: 'Roberto Carlos', email: 'r.carlos@mail.com', phone: '555-7788', plan: 'Anual', status: 'Activo' }
        ]);

        // Crear Rutinas
        await Routine.insertMany([
            { name: 'Nociones Básicas', level: 'Principiante', focus: 'Cuerpo Completo', icon: '🔰' },
            { name: 'Push Day (Empuje)', level: 'Intermedio', focus: 'Pecho, Hombros y Tríceps', icon: '🔥' },
            { name: 'Front Lever Prep', level: 'Avanzado', focus: 'Espalda y Core', icon: '🦅' },
            { name: 'Leg Day', level: 'Intermedio', focus: 'Piernas y Glúteos', icon: '🦵' }
        ]);

        // Crear Pagos
        await Payment.insertMany([
            { memberName: 'Miguel Torres', concept: 'Mensualidad Mayo', amount: 60, status: 'Pagado' },
            { memberName: 'Carla Ruiz', concept: 'Plan Élite Trimestral', amount: 150, status: 'Pagado' },
            { memberName: 'Daniel Romo', concept: 'Mensualidad Mayo', amount: 60, status: 'Pendiente' },
            { memberName: 'Laura Medina', concept: 'Mensualidad Junio', amount: 60, status: 'Pagado' },
            { memberName: 'Roberto Carlos', concept: 'Mensualidad Mayo', amount: 70, status: 'Pendiente' }
        ]);

        // Crear Citas
        await Appointment.insertMany([
            { title: 'Evaluación Inicial', memberName: 'Laura Medina', time: '09:00', duration: '30 min', status: 'Confirmada' },
            { title: 'Masterclass Front Lever', memberName: 'Carla Ruiz', time: '10:30', duration: '1 hr', status: 'Confirmada' },
            { title: 'Clase Empuje', memberName: 'Miguel Torres', time: '17:00', duration: '1 hr', status: 'Pendiente' },
            { title: 'Nociones Básicas', memberName: 'Daniel Romo', time: '18:30', duration: '1 hr', status: 'Pendiente' }
        ]);

        console.log('¡Datos Mockup insertados exitosamente!');
        process.exit(0);

    } catch (err) {
        console.error('Error insertando datos mock:', err);
        process.exit(1);
    }
};

runSeed();
