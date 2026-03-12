import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_gym_key';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY name ASC');
    res.json(result.rows);
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

// --- VISITS ---
app.post('/api/visits', async (req, res) => {
  const { member_id, member_name } = req.body;
  try {
    await pool.query('INSERT INTO visits (member_id, member_name) VALUES ($1, $2)', [member_id, member_name]);
    await pool.query('UPDATE members SET last_visit=NOW() WHERE id=$1', [member_id]);
    res.sendStatus(201);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => {
  console.log(`🚀 Motor del Gym corriendo en port ${port}`);
});
