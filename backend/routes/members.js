import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { MemberSchema } from '../validators/schemas.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/members
 * Devuelve todos los miembros ordenados por nombre.
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM members ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/members
 * Crea un nuevo miembro con validación Zod, registra primera visita y bienvenida.
 */
router.post('/', async (req, res) => {
  try {
    const validated = MemberSchema.parse(req.body);
    const { signature } = req.body;
    const result = await query(
      'INSERT INTO members (name, email, phone, plan, status, expiration_date, signature_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [validated.name, validated.email, validated.phone, validated.plan, validated.status || 'Activo', validated.cutoffDate || null, signature || null, validated.joinDate || 'NOW()']
    );

    const newMember = result.rows[0];

    // Registrar primera visita automáticamente
    await query('INSERT INTO visits (member_id, member_name) VALUES ($1, $2)', [newMember.id, newMember.name]);
    await query('UPDATE members SET last_visit=NOW() WHERE id=$1', [newMember.id]);

    // Notificación de bienvenida
    await query(
      'INSERT INTO notifications_log (member_id, member_name, type, message) VALUES ($1, $2, $3, $4)',
      [newMember.id, newMember.name, 'welcome', `¡Bienvenido ${newMember.name}! Es un gusto tenerte en Gym.`]
    );

    res.status(201).json(newMember);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error creating member:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/members/:id
 * Actualiza los datos de un miembro.
 */
router.put('/:id', async (req, res) => {
  const { name, email, phone, plan, status, expiration_date } = req.body;
  try {
    const result = await query(
      'UPDATE members SET name=$1, email=$2, phone=$3, plan=$4, status=$5, expiration_date=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, email, phone, plan, status, expiration_date, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Miembro no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/members/:id
 * Elimina un miembro.
 */
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM members WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
