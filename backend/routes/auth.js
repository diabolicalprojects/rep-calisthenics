import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { query } from '../config/db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.' }
});

/**
 * POST /api/auth/login
 * Autentica un usuario por email o username + contraseña.
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginId = (identifier || email || username || '').toString().trim();
  const rawPassword = (password || '').toString().trim();

  if (!loginId || !rawPassword) {
    return res.status(400).json({ error: 'Email/Usuario y Contraseña son requeridos' });
  }

  try {
    const result = await query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)',
      [loginId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPass = await bcrypt.compare(rawPassword, user.password);
    if (!validPass) {
      return res.status(401).json({ error: 'Clave incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (err) {
    console.error('[AUTH] Error en login:', err);
    res.status(500).json({ error: 'Error interno en el servidor de autenticación' });
  }
});

/**
 * POST /api/support/request-reset
 * Registra una solicitud de cambio de contraseña. Ruta pública (sin token).
 */
router.post('/request-reset', async (req, res) => {
  const { identifier, message } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'Identificador (email o usuario) es requerido' });
  }

  try {
    const user = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)',
      [identifier.trim()]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await query(
      'INSERT INTO support_requests (user_id, type, message) VALUES ($1, $2, $3)',
      [user.rows[0].id, 'password_reset', message || 'Solicitud de cambio de contraseña']
    );

    res.json({ message: 'Solicitud enviada a los administradores' });
  } catch (err) {
    console.error('[SUPPORT] Error en reset request:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
