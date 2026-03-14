import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = 4000; // Hardcoded to match Dokploy configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'secret_gym_key') {
  console.error('❌ ERROR CRÍTICO: JWT_SECRET no ha sido configurado o es inseguro.');
  console.error('El sistema no puede iniciar por razones de seguridad.');
  process.exit(1);
}

const APP_VERSION = '1.0.8'; 

if (!process.env.DATABASE_URL) {
  console.error('CRITICAL: DATABASE_URL is not set!');
  process.exit(1);
}

const { Pool } = pg;
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err.message);
  });
} catch (err) {
  console.error('Failed to create DB pool:', err.message);
}

// --- DB INITIALIZATION ---
const initDB = async () => {
  try {
    // 1. MIGRATION FIRST: Ensure balance/columns exist before running main SQL
    console.log('🔄 Verificando esquema de base de datos...');
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';`);

      // Fix old records if username is missing
      await pool.query(`
        UPDATE users SET username = email WHERE username IS NULL;
        ALTER TABLE users ALTER COLUMN username SET NOT NULL;
      `).catch(() => { }); // Already updated?

      // Add constraint separately
      await pool.query(`ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);`).catch(() => { });
    } catch (migErr) {
      console.warn('⚠️ Nota sobre migración:', migErr.message);
    }

    // 2. Initialize tables (if not exists)
    const sqlPath = path.join(__dirname, 'init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);

      // 3. FORCE DEVELOPER INSERT
      const hashedDevPass = await bcrypt.hash('Diabolical1502', 10);
      await pool.query(`
        INSERT INTO users (name, username, password, role, email) 
        VALUES ('Developer', 'DiabolicalDev', $1, 'developer', 'dev@diabolical.com')
        ON CONFLICT (username) DO UPDATE SET password = $1, role = 'developer';
      `, [hashedDevPass]);

      // 4. FIX ADMIN and other users (Hash plain text passwords)
      const allUsers = await pool.query('SELECT id, password, username FROM users');
      for (const u of allUsers.rows) {
        if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
          const hashed = await bcrypt.hash(u.password, 10);
          await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, u.id]);
        }
        if (u.username === 'admin@gym.com') {
          await pool.query("UPDATE users SET username = 'admin' WHERE id = $1", [u.id]);
        }
      }

      // 5. EXPENSES TABLE
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

      // 6. NOTIFICATIONS LOG
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          member_id UUID REFERENCES members(id),
          member_name TEXT,
          type TEXT, -- 'pre-expiration', 'expiration', 'overdue'
          status TEXT DEFAULT 'pending', -- 'pending', 'sent'
          message TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ Base de Datos, Roles, Egresos y Logs actualizados');
    }
  } catch (err) {
    console.error('❌ Error inicializando la Base de Datos:', err);
  }
};

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado: Permisos insuficientes' });
    }
    next();
  };
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { identifier, email, password } = req.body;
  let loginId = (identifier || email || '').toString().trim();
  const rawPassword = (password || '').toString().trim();

  console.log(`\n🔍 Login attempt: "${loginId}"`);
  console.log(`   Password length: ${rawPassword?.length}`);
  if (rawPassword) {
    const hexPass = Buffer.from(rawPassword).toString('hex');
    console.log(`   Password Hex: ${hexPass}`);
  }

  if (!loginId || !rawPassword) {
    return res.status(400).json({ error: 'Email/Usuario y Contraseña son requeridos' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)',
      [loginId]
    );

    const user = result.rows[0];
    if (!user) {
      console.log(`❌ User NOT found: "${loginId}"`);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log(`👤 User found: ID=${user.id}, User=${user.username}, Role=${user.role}`);

    // Secure password check
    const validPass = await bcrypt.compare(rawPassword, user.password);
    if (!validPass) {
      console.log(`🚫 Wrong password for: "${loginId}"`);
      console.log(`   Detailed Debug: StoredHashPrefix=${user.password.substring(0, 10)}, ReceivedLength=${rawPassword.length}`);

      const debugData = (user.role === 'developer') ? {
        receivedLength: rawPassword.length,
        storedHashPrefix: user.password.substring(0, 10)
      } : undefined;

      return res.status(401).json({
        error: 'Clave incorrecta',
        debug: debugData
      });
    }

    console.log(`✅ Login successful: ${user.username}`);
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, permissions: user.permissions } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error en login' });
  }
});

app.get('/api/debug/version', (req, res) => {
  res.json({ version: APP_VERSION, server_time: new Date().toISOString() });
});

// --- PUBLIC BOOKING HELPERS ---
// This allows the public page to see busy slots WITHOUT leaking member names/details
app.get('/api/public/appointments', async (req, res) => {
  const { date } = req.query;
  try {
    if (!date) return res.status(400).json({ error: 'Date is required' });
    const result = await pool.query('SELECT time FROM appointments WHERE date = $1', [date]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- USER MANAGEMENT ---
app.get('/api/users', authenticateToken, authorize(['developer', 'admin']), async (req, res) => {
  try {
    // Developers see everyone. Admins see everyone except developers.
    let queryText = 'SELECT id, name, email, username, role, permissions, created_at FROM users';
    let params = [];
    if (req.user.role === 'admin') {
      queryText = 'SELECT id, name, email, username, role, permissions, created_at FROM users WHERE role != \'developer\'';
    }
    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/reveal-passwords', authenticateToken, authorize(['developer', 'admin']), async (req, res) => {
  const { password } = req.body;
  try {
    // SECURITY LOCK: Re-verify requester's password
    const verifyResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (verifyResult.rows[0].password !== password) {
      return res.status(401).json({ error: 'Credenciales de seguridad incorrectas' });
    }

    let queryText = 'SELECT username, password, role FROM users';
    if (req.user.role === 'admin') {
      queryText = 'SELECT username, password, role FROM users WHERE role != \'developer\'';
    }
    const result = await pool.query(queryText);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', authenticateToken, authorize(['developer', 'admin']), async (req, res) => {
  const { name, email, username, password, role, permissions } = req.body;
  try {
    if (req.user.role === 'admin' && role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios Developer' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, username, password, role, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, role',
      [name, email, username, hashedPassword, role, JSON.stringify(permissions || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', authenticateToken, authorize(['developer', 'admin']), async (req, res) => {
  const { name, email, username, password, role, permissions } = req.body;
  try {
    const userToUpdate = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
    if (!userToUpdate.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (req.user.role === 'admin' && userToUpdate.rows[0].role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para editar a un Developer' });
    }
    if (req.user.role === 'admin' && role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para asignar el rol Developer' });
    }

    let query = 'UPDATE users SET name=$1, email=$2, username=$3, role=$4, permissions=$5';
    let params = [name, email, username, role, JSON.stringify(permissions || {})];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password=$6 WHERE id=$7 RETURNING id, name, username, role';
      params.push(hashedPassword, req.params.id);
    } else {
      query += ' WHERE id=$6 RETURNING id, name, username, role';
      params.push(req.params.id);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', authenticateToken, authorize(['developer', 'admin']), async (req, res) => {
  try {
    const userToDelete = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
    if (!userToDelete.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (req.user.role === 'admin' && userToDelete.rows[0].role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar a un Developer' });
    }
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SUPPORT / PASSWORD REQUESTS ---
app.post('/api/support/request-reset', async (req, res) => {
  const { username, message } = req.body;
  try {
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    await pool.query(
      'INSERT INTO support_requests (user_id, type, message) VALUES ($1, $2, $3)',
      [userResult.rows[0].id, 'password_reset', message || 'Solicitud de cambio de contraseña']
    );
    res.json({ message: 'Solicitud enviada a los administradores' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MEMBERS ---
app.get('/api/members', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/members', authenticateToken, async (req, res) => {
  const { name, email, phone, plan, expiration_date, signature_data } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO members (name, email, phone, plan, expiration_date, signature_data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, plan, expiration_date, signature_data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/members/:id', authenticateToken, async (req, res) => {
  const { name, email, phone, plan, status, expiration_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE members SET name=$1, email=$2, phone=$3, plan=$4, status=$5, expiration_date=$6 WHERE id=$7 RETURNING *',
      [name, email, phone, plan, status, expiration_date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/members/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- INVENTORY ---
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory', authenticateToken, async (req, res) => {
  const { name, price, quantity, category } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO inventory (name, price, quantity, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, quantity, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inventory/:id', authenticateToken, async (req, res) => {
  const { quantity } = req.body;
  try {
    const result = await pool.query('UPDATE inventory SET quantity=$1, last_update=NOW() WHERE id=$2 RETURNING *', [quantity, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MEMBERSHIPS ---
app.get('/api/memberships', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM memberships ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memberships', authenticateToken, async (req, res) => {
  const { name, price, duration, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO memberships (name, price, duration_days, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, duration, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/memberships/:id', authenticateToken, async (req, res) => {
  const { name, price, duration, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE memberships SET name=$1, price=$2, duration_days=$3, description=$4 WHERE id=$5 RETURNING *',
      [name, price, duration, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/memberships/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM memberships WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSACTIONS ---
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { total_amount, payment_method, cashier_name, items, type } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Register transaction
    const txResult = await client.query(
      'INSERT INTO transactions (total_amount, payment_method, cashier_name, items, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [total_amount, payment_method, cashier_name, JSON.stringify(items), type]
    );

    // Decrement inventory if applicable
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.type === 'retail' || (!item.type && item.id)) {
           // We assume item.id is valid for inventory. We use a partial name match or id if provided
           // The POS currently sends item object from inventory, so it has id
           await client.query(
             'UPDATE inventory SET quantity = quantity - 1 WHERE id = $1 AND quantity > 0',
             [item.id]
           );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(txResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- EXPENSES ---
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { description, amount, category, recorded_by } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO expenses (description, amount, category, recorded_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [description, amount, category, recorded_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYMENTS (Accounting) ---
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  const { memberName, memberId, concept, amount, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO payments (member_name, member_id, concept, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [memberName, memberId, concept, amount, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- VISITS ---
app.get('/api/visits', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visits ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/visits', authenticateToken, async (req, res) => {
  const { member_id, member_name } = req.body;
  try {
    await pool.query('INSERT INTO visits (member_id, member_name) VALUES ($1, $2)', [member_id, member_name]);
    if (member_id) {
      await pool.query('UPDATE members SET last_visit=NOW() WHERE id=$1', [member_id]);
    }
    res.sendStatus(201);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- APPOINTMENTS ---
app.get('/api/appointments', authenticateToken, async (req, res) => {
  const { date } = req.query;
  try {
    let queryText = 'SELECT * FROM appointments ORDER BY date ASC, time ASC';
    let params = [];
    if (date) {
      queryText = "SELECT * FROM appointments WHERE date = $1 OR status = 'Pendiente' ORDER BY date ASC, time ASC";
      params = [date];
    }
    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/appointments', async (req, res) => {
  const { title, memberName, time, date, duration, status, phone, email } = req.body;
  try {
    const notes = (phone || email) ? `Teléfono: ${phone || 'N/A'}, Email: ${email || 'N/A'}` : '';
    const result = await pool.query(
      'INSERT INTO appointments (title, member_name, time, date, duration, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, memberName, time, date, duration, status || 'Pendiente', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/appointments/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ROUTINES ---
app.get('/api/routines', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM routines ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/routines', authenticateToken, async (req, res) => {
  const { name, level, focus, icon, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO routines (name, level, focus, icon, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, level, focus, icon, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/routines/:id', authenticateToken, async (req, res) => {
  const { name, level, focus, icon, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE routines SET name=$1, level=$2, focus=$3, icon=$4, description=$5 WHERE id=$6 RETURNING *',
      [name, level, focus, icon, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/routines/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM routines WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- NOTIFICATIONS LOG ---
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications_log ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- REVENUE PROJECTION & EXPIRATION CHECKER (DIABOLICAL ENGINE) ---
const checkExpirations = async () => {
  console.log('🔄 Diabolical Engine: Verificando expiraciones y renovaciones...');
  try {
    // 1. Members expiring in 3 days (Pre-warning)
    const expiringSoon = await pool.query(`
      SELECT m.id, m.name, m.email, m.phone, m.expiration_date 
      FROM members m 
      WHERE m.expiration_date = CURRENT_DATE + INTERVAL '3 days' 
      AND m.status = 'Activo'
      AND NOT EXISTS (SELECT 1 FROM notifications_log n WHERE n.member_id = m.id AND n.type = 'pre-expiration' AND n.timestamp > CURRENT_DATE - INTERVAL '1 day')
    `);

    for (const m of expiringSoon.rows) {
      await pool.query(
        'INSERT INTO notifications_log (member_id, member_name, type, message) VALUES ($1, $2, $3, $4)',
        [m.id, m.name, 'pre-expiration', `Recordatorio: Tu membresía vence en 3 días (${m.expiration_date}).`]
      );
    }

    // 2. Members expiring TODAY
    const expiringToday = await pool.query(`
      SELECT m.id, m.name, m.email, m.phone, m.expiration_date 
      FROM members m 
      WHERE m.expiration_date = CURRENT_DATE
      AND m.status = 'Activo'
      AND NOT EXISTS (SELECT 1 FROM notifications_log n WHERE n.member_id = m.id AND n.type = 'expiration' AND n.timestamp > CURRENT_DATE - INTERVAL '1 day')
    `);

    for (const m of expiringToday.rows) {
      await pool.query(
        'INSERT INTO notifications_log (member_id, member_name, type, message) VALUES ($1, $2, $3, $4)',
        [m.id, m.name, 'expiration', `Aviso: Tu membresía vence HOY. Te esperamos para renovar.`]
      );
    }

    console.log(`✅ Diabolical Engine: ${expiringSoon.rowCount + expiringToday.rowCount} avisos generados.`);
  } catch (err) {
    console.error('❌ Error en Diabolical Engine:', err.message);
  }
};

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is reachable', version: APP_VERSION });
});

// --- SERVER STARTUP ---
app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 Motor del Gym corriendo en port ${port}`);
  if (pool) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ DB connection OK');
      await initDB();
      
      // Run checker on startup
      setTimeout(checkExpirations, 5000); 
      // And every 12 hours
      setInterval(checkExpirations, 1000 * 60 * 60 * 12);
      
    } catch (err) {
      console.error('⚠️  DB not reachable at startup:', err.message);
    }
  } else {
    console.error('⚠️  No DB pool available - running without database');
  }
});
