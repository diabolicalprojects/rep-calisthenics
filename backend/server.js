import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Importar rutas
import memberRoutes from './routes/members.js';
import routineRoutes from './routes/routines.js';
import paymentRoutes from './routes/payments.js';
import appointmentRoutes from './routes/appointments.js';
import inventoryRoutes from './routes/inventory.js';

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB (Opcional por ahora, si no hay URI no crashea)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rep-calisthenics';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conectado exitosamente a la base de datos de MongoDB'))
    .catch((err) => console.log('Aviso: Base de datos no conectada. Asegúrate de tener MongoDB instalado localmente o un Cluster configurado.', err.message));

// Usar rutas
app.use('/api/members', memberRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/inventory', inventoryRoutes);

// Rutas base (MVP)
app.get('/api', (req, res) => {
    res.json({ message: 'Bienvenido a la API de Gym Gym Management' });
});

// Endpoint ejemplo: Obtener estadísticas para el dashboard
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        activeMembers: 142,
        monthlyRevenue: 8450,
        pendingDebts: 1200
    });
});

app.listen(PORT, () => {
    console.log(`\n================================`);
    console.log(`🚀 Servidor Backend en ejecución`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`================================\n`);
});
