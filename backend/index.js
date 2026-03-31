import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { getPool } from './config/db.js';
import { query } from './config/db.js';

// ─── RUTAS ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import membersRoutes from './routes/members.js';
import inventoryRoutes from './routes/inventory.js';
import membershipsRoutes from './routes/memberships.js';
import transactionsRoutes from './routes/transactions.js';
import expensesRoutes from './routes/expenses.js';
import paymentsRoutes from './routes/payments.js';
import visitsRoutes from './routes/visits.js';
import appointmentsRoutes from './routes/appointments.js';
import routinesRoutes from './routes/routines.js';
import cashRegisterRoutes from './routes/cashRegister.js';
import retentionRoutes from './routes/retention.js';

dotenv.config();

// ─── VALIDACIONES DE ARRANQUE ─────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret_gym_key') {
  console.error('❌ ERROR CRÍTICO: JWT_SECRET no ha sido configurado o es inseguro.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const APP_VERSION = '2.0.0';

// ─── MIDDLEWARE GLOBAL ────────────────────────────────────────────────────────
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

// ─── RUTAS DE API ─────────────────────────────────────────────────────────────
// Auth: /api/auth/login
app.use('/api/auth', authRoutes);
// Support: /api/support/request-reset (mismo router, prefijo diferente)
app.use('/api/support', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/routines', routinesRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/retention', retentionRoutes);

// ─── RUTA PÚBLICA (sin autenticación) ────────────────────────────────────────
// Solo expone los horarios ocupados sin revelar datos de miembros
app.get('/api/public/appointments', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'El parámetro date es requerido' });
  try {
    const result = await query('SELECT time FROM appointments WHERE date = $1', [date]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching public appointments:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await query('SELECT * FROM notifications_log ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── HEALTH CHECK & VERSION ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is reachable', version: APP_VERSION });
});

app.get('/api/debug/version', (req, res) => {
  res.json({ version: APP_VERSION, server_time: new Date().toISOString() });
});

// ─── MOTOR DE EXPIRACIÓN ──────────────────────────────────────────────────────
const checkExpirations = async () => {
  console.log('🔄 Diabolical Engine: Verificando expiraciones...');
  try {
    const expiringSoon = await query(`
      SELECT m.id, m.name, m.expiration_date
      FROM members m
      WHERE m.expiration_date = CURRENT_DATE + INTERVAL '3 days'
      AND m.status = 'Activo'
      AND NOT EXISTS (
        SELECT 1 FROM notifications_log n
        WHERE n.member_id = m.id AND n.type = 'pre-expiration'
        AND n.timestamp > CURRENT_DATE - INTERVAL '1 day'
      )
    `);

    for (const m of expiringSoon.rows) {
      await query(
        'INSERT INTO notifications_log (member_id, member_name, type, message) VALUES ($1, $2, $3, $4)',
        [m.id, m.name, 'pre-expiration', `Recordatorio: Tu membresía vence en 3 días (${m.expirationDate}).`]
      );
    }

    const expiringToday = await query(`
      SELECT m.id, m.name, m.expiration_date
      FROM members m
      WHERE m.expiration_date = CURRENT_DATE
      AND m.status = 'Activo'
      AND NOT EXISTS (
        SELECT 1 FROM notifications_log n
        WHERE n.member_id = m.id AND n.type = 'expiration'
        AND n.timestamp > CURRENT_DATE - INTERVAL '1 day'
      )
    `);

    for (const m of expiringToday.rows) {
      await query(
        'INSERT INTO notifications_log (member_id, member_name, type, message) VALUES ($1, $2, $3, $4)',
        [m.id, m.name, 'expiration', 'Aviso: Tu membresía vence HOY. Te esperamos para renovar.']
      );
    }

    // ─── MARCAR EXPIRADOS ─────────────────────────────────────────────────────
    const expired = await query(`
      UPDATE members SET status = 'Inactivo' 
      WHERE expiration_date < CURRENT_DATE 
      AND status = 'Activo' 
      RETURNING id, name
    `);
    if (expired.rows.length > 0) {
      console.log(`📉 Diabolical Engine: ${expired.rows.length} miembros marcados como Inactivos.`);
    }

    const totalAlertas = expiringSoon.rows.length + expiringToday.rows.length;
    console.log(`✅ Diabolical Engine: ${totalAlertas} avisos generados.`);

    // ─── LÓGICA DE RETENCIÓN ──────────────────────────────────────────────────
    console.log('🔄 Diabolical Engine: Buscando socios inactivos (>15 días)...');
    const inactiveMembers = await query(`
        SELECT id, name FROM members 
        WHERE last_visit < CURRENT_DATE - INTERVAL '15 days'
        AND status = 'Activo'
        AND NOT EXISTS (
            SELECT 1 FROM retention_contacts_log 
            WHERE member_id = members.id AND timestamp > CURRENT_DATE - INTERVAL '7 days'
        )
    `);

    for (const m of inactiveMembers.rows) {
        await query(
            'INSERT INTO notifications_log (member_id, member_name, type, message) VALUES ($1, $2, $3, $4)',
            [m.id, m.name, 'retention_alert', `Alerta de Retención: ${m.name} no ha asistido en más de 15 días.`]
        );
    }
    console.log(`✅ Diabolical Engine: ${inactiveMembers.rows.length} alertas de retención generadas.`);

  } catch (err) {
    console.error('❌ Error en Diabolical Engine:', err.message);
  }
};

app.post('/api/notifications/check-expirations', async (req, res) => {
  await checkExpirations();
  res.json({ message: 'Verificación de expiraciones completada.' });
});

// ─── INICIO DE SERVIDOR ───────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Gym Backend v${APP_VERSION} corriendo en puerto ${PORT}`);
  const pool = getPool();
  if (pool) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ DB connection OK');
      await initDB();
      // Verificar expiraciones al arrancar y cada 12 horas
      setTimeout(checkExpirations, 5000);
      setInterval(checkExpirations, 1000 * 60 * 60 * 12);
    } catch (err) {
      console.error('⚠️  DB no disponible al arrancar:', err.message);
    }
  }
});

// ─── INICIALIZACIÓN DE BASE DE DATOS ─────────────────────────────────────────
const initDB = async () => {
  const pool = getPool();
  try {
    console.log('🔄 Verificando esquema de base de datos...');

    // Migraciones: columnas opcionales
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';`);
      await pool.query(`
        UPDATE users SET username = email WHERE username IS NULL;
        ALTER TABLE users ALTER COLUMN username SET NOT NULL;
      `).catch(() => {});
      await pool.query(`ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);`).catch(() => {});
    } catch (migErr) {
      console.warn('⚠️ Nota sobre migración de columnas:', migErr.message);
    }

    // Ejecutar SQL base (tablas)
    const sqlPath = path.join(__dirname, 'init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
    }

    // ─── SEED SEGURO: usando variables de entorno ─────────────────────────────
    const bcrypt = await import('bcryptjs');

    // Crear/actualizar usuario Developer desde env vars
    const devPassword = process.env.INITIAL_DEV_PASSWORD;
    if (devPassword) {
      const hashedDevPass = await bcrypt.default.hash(devPassword, 10);
      await pool.query(`
        INSERT INTO users (name, username, password, role, email)
        VALUES ('Developer', 'DiabolicalDev', $1, 'developer', 'dev@diabolical.com')
        ON CONFLICT (username) DO UPDATE SET
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          email = EXCLUDED.email;
      `, [hashedDevPass]);
    }

    // Crear/actualizar usuario Admin desde env vars
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    if (adminPassword) {
      const hashedAdminPass = await bcrypt.default.hash(adminPassword, 10);
      await pool.query(`
        INSERT INTO users (name, username, password, role, email)
        VALUES ('Administrador', 'admin', $1, 'admin', 'admin@gym.com')
        ON CONFLICT (username) DO UPDATE SET
          password = EXCLUDED.password;
      `, [hashedAdminPass]);
    }

    // Hashear contraseñas que siguen en texto plano (migración legacy)
    const allUsers = await pool.query('SELECT id, password FROM users');
    for (const u of allUsers.rows) {
      if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
        const bcryptLib = await import('bcryptjs');
        const hashed = await bcryptLib.default.hash(u.password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, u.id]);
        console.log(`🔒 Contraseña hasheada para usuario ID: ${u.id}`);
      }
    }

    // Tablas adicionales
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO expense_categories (name) VALUES
        ('Mantenimiento'), ('Servicios'), ('Sueldos'), ('Renta'), ('Limpieza'), ('Otros')
      ON CONFLICT (name) DO NOTHING;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cash_registers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        status TEXT DEFAULT 'open',
        opening_balance DECIMAL(10,2) NOT NULL,
        closing_balance DECIMAL(10,2),
        opening_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        closing_time TIMESTAMP WITH TIME ZONE,
        cashier_id UUID REFERENCES users(id),
        cashier_name TEXT,
        notes TEXT
      );
    `);

    try {
      await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS register_id UUID REFERENCES cash_registers(id);`);
    } catch (e) { console.warn("Error agregando register_id:", e.message); }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        recorded_by UUID REFERENCES users(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS retention_contacts_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID REFERENCES members(id),
        type TEXT,
        status TEXT DEFAULT 'sent',
        message TEXT,
        recorded_by UUID REFERENCES users(id),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID REFERENCES members(id),
        member_name TEXT,
        type TEXT,
        status TEXT DEFAULT 'pending',
        message TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Base de Datos inicializada correctamente');
  } catch (err) {
    console.error('❌ Error inicializando la Base de Datos:', err);
  }
};
