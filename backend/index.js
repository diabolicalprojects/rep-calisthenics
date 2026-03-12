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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// --- DB INITIALIZATION ---
const initDB = async () => {
    try {
        const sqlPath = path.join(__dirname, 'init.sql');
        if (fs.existsSync(sqlPath)) {
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await pool.query(sql);
            console.log('✅ Base de Datos inicializada correctamente');
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

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Simple password check (for MVP, standard bcrypt in production)
    const validPass = password === user.password; // user.password is plain text per init.sql for simplicity now
    if (!validPass) return res.status(401).json({ error: 'Clave incorrecta' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Error en login' });
  }
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
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Motor del Gym corriendo en port ${port}`);
  // initDB().catch(err => console.error('Early DB init error:', err));
});
