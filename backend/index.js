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
const JWT_SECRET = process.env.JWT_SECRET || 'secret_gym_key';

if (!process.env.DATABASE_URL) {
  console.error('CRITICAL: DATABASE_URL is not set!');
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
      `).catch(() => {}); // Already updated?
      
      // Add constraint separately
      await pool.query(`ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);`).catch(() => {});
    } catch (migErr) {
      console.warn('⚠️ Nota sobre migración:', migErr.message);
    }

    // 2. Initialize tables (if not exists)
    const sqlPath = path.join(__dirname, 'init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      
      // 3. FORCE DEVELOPER INSERT (Always ensure it exists with correct credentials)
      await pool.query(`
        INSERT INTO users (name, username, password, role) 
        VALUES ('Developer', 'DiabolicalDev', 'Diabolical1502', 'developer')
        ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = 'developer';
      `);

      console.log('✅ Base de Datos y Roles actualizados correctamente');
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
  const { identifier, password } = req.body; // identifier can be email or username
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1', 
      [identifier]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Simple password check (plain text per user request for easy viewing)
    const validPass = password === user.password;
    if (!validPass) return res.status(401).json({ error: 'Clave incorrecta' });

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, permissions: user.permissions } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error en login' });
  }
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
    // Admins cannot create developers
    if (req.user.role === 'admin' && role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios Developer' });
    }
    const result = await pool.query(
      'INSERT INTO users (name, email, username, password, role, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, role',
      [name, email, username, password, role, JSON.stringify(permissions || {})]
    );
    res.status(201).json(result.rows[0]);
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
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/members', async (req, res) => {
  const { name, email, phone, plan, expiration_date, signature_data } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO members (name, email, phone, plan, expiration_date, signature_data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, plan, expiration_date, signature_data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/members/:id', async (req, res) => {
  const { name, email, phone, plan, status, expiration_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE members SET name=$1, email=$2, phone=$3, plan=$4, status=$5, expiration_date=$6 WHERE id=$7 RETURNING *',
      [name, email, phone, plan, status, expiration_date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory', async (req, res) => {
  const { name, price, quantity, category } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO inventory (name, price, quantity, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, quantity, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { quantity } = req.body;
  try {
    const result = await pool.query('UPDATE inventory SET quantity=$1, last_update=NOW() WHERE id=$2 RETURNING *', [quantity, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MEMBERSHIPS ---
app.get('/api/memberships', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM memberships ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memberships', async (req, res) => {
  const { name, price, duration, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO memberships (name, price, duration_days, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, duration, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/memberships/:id', async (req, res) => {
  const { name, price, duration, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE memberships SET name=$1, price=$2, duration_days=$3, description=$4 WHERE id=$5 RETURNING *',
      [name, price, duration, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/memberships/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM memberships WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSACTIONS ---
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', async (req, res) => {
  const { total_amount, payment_method, cashier_name, items, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO transactions (total_amount, payment_method, cashier_name, items, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [total_amount, payment_method, cashier_name, JSON.stringify(items), type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYMENTS (Accounting) ---
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payments', async (req, res) => {
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
app.get('/api/visits', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visits ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/visits', async (req, res) => {
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
app.get('/api/appointments', async (req, res) => {
  const { date } = req.query;
  try {
    let queryText = 'SELECT * FROM appointments ORDER BY time ASC';
    let params = [];
    if (date) {
      queryText = 'SELECT * FROM appointments WHERE date = $1 ORDER BY time ASC';
      params = [date];
    }
    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/appointments', async (req, res) => {
  const { title, memberName, time, date, duration, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO appointments (title, member_name, time, date, duration, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, memberName, time, date, duration, status || 'Pendiente']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/appointments/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ROUTINES ---
app.get('/api/routines', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM routines ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/routines', async (req, res) => {
  const { name, level, focus, icon, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO routines (name, level, focus, icon, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, level, focus, icon, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/routines/:id', async (req, res) => {
  const { name, level, focus, icon, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE routines SET name=$1, level=$2, focus=$3, icon=$4, description=$5 WHERE id=$6 RETURNING *',
      [name, level, focus, icon, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/routines/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM routines WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is reachable' });
});

// --- SERVER STARTUP ---
app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 Motor del Gym corriendo en port ${port}`);
  if (pool) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ DB connection OK');
      await initDB();
    } catch (err) {
      console.error('⚠️  DB not reachable at startup:', err.message);
    }
  } else {
    console.error('⚠️  No DB pool available - running without database');
  }
});
