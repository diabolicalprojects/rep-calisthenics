import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/routines
 * Lista todas las rutinas.
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM routines ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching routines:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/routines
 * Crea una nueva rutina.
 */
router.post('/', async (req, res) => {
  const { name, level, focus, icon, description } = req.body;
  try {
    const result = await query(
      'INSERT INTO routines (name, level, focus, icon, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, level, focus, icon, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating routine:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/routines/:id
 * Actualiza una rutina existente.
 */
router.put('/:id', async (req, res) => {
  const { name, level, focus, icon, description } = req.body;
  try {
    const result = await query(
      'UPDATE routines SET name=$1, level=$2, focus=$3, icon=$4, description=$5 WHERE id=$6 RETURNING *',
      [name, level, focus, icon, description, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Rutina no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating routine:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/routines/:id
 * Elimina una rutina.
 */
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM routines WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting routine:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
