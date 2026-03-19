import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { UserSchema } from '../validators/schemas.js';
import { z } from 'zod';

const router = express.Router();

// Aplicar autenticación a todas las rutas de este router
router.use(authenticateToken);
router.use(authorize(['developer', 'admin']));

/**
 * GET /api/users
 * Lista todos los usuarios. Admins no pueden ver Developers.
 */
router.get('/', async (req, res) => {
  try {
    let queryText = 'SELECT id, name, email, username, role, permissions, created_at FROM users';
    const params = [];
    if (req.user.role === 'admin') {
      queryText += " WHERE role != 'developer'";
    }
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/users
 * Crea un nuevo usuario. Valida con Zod.
 */
router.post('/', async (req, res) => {
  try {
    const validated = UserSchema.parse(req.body);

    if (req.user.role === 'admin' && validated.role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios Developer' });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const result = await query(
      'INSERT INTO users (name, email, username, password, role, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, role',
      [validated.name, validated.email, validated.username, hashedPassword, validated.role, JSON.stringify(validated.permissions || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/users/:id
 * Actualiza un usuario existente. Valida con Zod.
 */
router.put('/:id', async (req, res) => {
  try {
    const userToUpdate = await query('SELECT role FROM users WHERE id = $1', [req.params.id]);
    if (!userToUpdate.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (req.user.role === 'admin' && userToUpdate.rows[0].role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para editar a un Developer' });
    }
    if (req.user.role === 'admin' && req.body.role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para asignar el rol Developer' });
    }

    const { name, email, username, password, role, permissions } = req.body;
    let sqlQuery = 'UPDATE users SET name=$1, email=$2, username=$3, role=$4, permissions=$5';
    let params = [name, email, username, role, JSON.stringify(permissions || {})];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sqlQuery += ', password=$6 WHERE id=$7 RETURNING id, name, username, role';
      params.push(hashedPassword, req.params.id);
    } else {
      sqlQuery += ' WHERE id=$6 RETURNING id, name, username, role';
      params.push(req.params.id);
    }

    const result = await query(sqlQuery, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/users/:id
 * Elimina un usuario. No puede eliminarse a sí mismo.
 */
router.delete('/:id', async (req, res) => {
  try {
    const userToDelete = await query('SELECT role FROM users WHERE id = $1', [req.params.id]);
    if (!userToDelete.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (req.user.role === 'admin' && userToDelete.rows[0].role === 'developer') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar a un Developer' });
    }
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
