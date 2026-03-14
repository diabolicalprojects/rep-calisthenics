import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pg from 'pg';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
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

const APP_VERSION = '1.0.9'; 

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: { error: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.' }
});

// --- SCHEMAS (ZOD) ---
const ExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
  recorded_by: z.string().optional()
});

const TransactionSchema = z.object({
  total_amount: z.number().nonnegative(),
  payment_method: z.string(),
  cashier_name: z.string().optional(),
  type: z.string().optional(),
  items: z.array(z.any()).optional()
});

const MemberSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  plan: z.string(),
  status: z.enum(['Activo', 'Inactivo']).optional(),
  joinDate: z.string().optional(),
  cutoffDate: z.string().optional()
});

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

      // 5. EXPENSES CATEGORIES
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

      // 6. EXPENSES TABLE
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
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { identifier, email, username, password } = req.body;
  let loginId = (identifier || email || username || '').toString().trim();
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
    res.json(result.rows[0]);
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
  try {
    const validated = MemberSchema.parse(req.body);
    const { signature } = req.body;
    const result = await pool.query(
      'INSERT INTO members (name, email, phone, plan, status, expiration_date, signature_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [validated.name, validated.email, validated.phone, validated.plan, validated.status || 'Activo', validated.cutoffDate || null, signature || null, validated.joinDate || 'NOW()']
    );

    // Automated First Entry (Trigger visit record)
    const newMember = result.rows[0];
    await pool.query('INSERT INTO visits (member_id, member_name) VALUES ($1, $2)', [newMember.id, newMember.name]);
    await pool.query('UPDATE members SET last_visit=NOW() WHERE id=$1', [newMember.id]);

    // Welcome Notification
    await pool.query(
      'INSERT INTO notifications_log (member_id, member_name, type, message) VALUES ($1, $2, $3, $4)',
      [newMember.id, newMember.name, 'welcome', `¡Bienvenido ${newMember.name}! Es un gusto tenerte en REP Calisthenics.`]
    );

    res.status(201).json(newMember);
  } catch (err) { 
    console.error('Error creating member:', err);
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message }); 
  }
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

app.delete('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
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
  const { startDate, endDate } = req.query;
  try {
    let queryText = 'SELECT * FROM transactions';
    let params = [];
    if (startDate && endDate) {
      queryText += ' WHERE timestamp BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    queryText += ' ORDER BY timestamp DESC';
    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { total_amount, payment_method, cashier_name, items, type } = TransactionSchema.parse(req.body);
    const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Duplicate charge control for subscriptions
    if (type === 'subscription' && items) {
      const memberItem = items.find(i => i.member_id);
      if (memberItem && memberItem.member_id) {
        const dupCheck = await client.query(
          "SELECT id FROM payments WHERE member_id = $1 AND concept = 'Renovación de Membresía' AND date >= CURRENT_DATE",
          [memberItem.member_id]
        );
        if (dupCheck.rows.length > 0) {
          throw new Error('Este miembro ya realizó un pago de suscripción hoy.');
        }
      }
    }
    
    // Register transaction
    const txResult = await client.query(
      'INSERT INTO transactions (total_amount, payment_method, cashier_name, items, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [total_amount, payment_method, cashier_name, JSON.stringify(items), type]
    );

    // Sync with Payments History (Accounting)
    // Find if there's a member_id in items (for membership sales)
    const memberItem = items.find(i => i.member_id);
    const memberId = memberItem ? memberItem.member_id : null;
    const memberName = memberItem ? memberItem.member_name : (type === 'subscription' ? 'Socio' : 'Cliente General');

    await client.query(
      'INSERT INTO payments (member_name, member_id, concept, amount, status, date) VALUES ($1, $2, $3, $4, $5, NOW())',
      [memberName, memberId, type === 'subscription' ? 'Renovación de Membresía' : 'Venta POS', total_amount, 'Pagado']
    );

    // Update member status and expiration if subscription
    if (type === 'subscription' && memberId) {
      await client.query(
        "UPDATE members SET status = 'Activo', expiration_date = CURRENT_DATE + INTERVAL '30 days' WHERE id = $1",
        [memberId]
      );
    }

    // Decrement inventory if applicable
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.type === 'retail' || (!item.type && item.id)) {
           const qtyToSubtract = item.quantity || 1;
           await client.query(
             'UPDATE inventory SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1',
             [qtyToSubtract, item.id]
           );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(txResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// --- EXPENSES ---
app.get('/api/expenses', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let queryText = 'SELECT * FROM expenses';
    let params = [];
    if (startDate && endDate) {
      queryText += ' WHERE date BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    queryText += ' ORDER BY date DESC';
    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const validated = ExpenseSchema.parse(req.body);
    // Ensure recorded_by is a valid UUID or fallback to the current user's ID
    const recordedBy = validated.recorded_by && validated.recorded_by.length === 36 ? validated.recorded_by : req.user.id;
    
    // Auto-save category to categories table if it's new
    if (validated.category) {
      await pool.query(
        'INSERT INTO expense_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [validated.category]
      );
    }

    const result = await pool.query(
      'INSERT INTO expenses (description, amount, category, recorded_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [validated.description, validated.amount, validated.category, recordedBy]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { 
    console.error('Error creating expense:', err);
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message }); 
  }
});

// --- EXPENSE CATEGORIES ---
app.get('/api/expenses/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expense_categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses/categories', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre es requerido' });
    const result = await pool.query(
      'INSERT INTO expense_categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/expenses/categories/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM expense_categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYMENTS (Accounting) ---
app.get('/api/payments', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let queryText = 'SELECT * FROM payments';
    let params = [];
    if (startDate && endDate) {
      queryText += ' WHERE date BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    queryText += ' ORDER BY date DESC';
    const result = await pool.query(queryText, params);
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
    // Validate UUID format for member_id if provided
    const validMemberId = (member_id && member_id.length === 36) ? member_id : null;
    
    await pool.query('INSERT INTO visits (member_id, member_name) VALUES ($1, $2)', [validMemberId, member_name]);
    if (validMemberId) {
      await pool.query('UPDATE members SET last_visit=NOW() WHERE id=$1', [validMemberId]);
    }
    res.sendStatus(201);
  } catch (err) { 
    console.error('Error recording visit:', err);
    res.status(500).json({ error: err.message }); 
  }
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

app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
  const fields = req.body;
  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
  
  try {
    const keys = Object.keys(fields);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const params = Object.values(fields);
    params.push(req.params.id);
    
    await pool.query(`UPDATE appointments SET ${setClause} WHERE id = $${params.length}`, params);
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

app.post('/api/notifications/check-expirations', authenticateToken, async (req, res) => {
  await checkExpirations();
  res.json({ message: 'Verificación de expiraciones completada y logs de notificación generados.' });
});

// Run every 24 hours
setInterval(checkExpirations, 24 * 60 * 60 * 1000);
// Also run on start
setTimeout(checkExpirations, 5000);

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
