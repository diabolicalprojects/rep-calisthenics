import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/memberships
 * Lista todos los planes de membresía disponibles.
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM memberships ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching memberships:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/memberships
 * Crea un nuevo plan de membresía.
 */
router.post('/', async (req, res) => {
  const { name, price, duration, description } = req.body;
  try {
    const result = await query(
      'INSERT INTO memberships (name, price, duration_days, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, duration, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating membership:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/memberships/:id
 * Actualiza un plan de membresía existente.
 */
router.put('/:id', async (req, res) => {
  const { name, price, duration, description } = req.body;
  try {
    const result = await query(
      'UPDATE memberships SET name=$1, price=$2, duration_days=$3, description=$4 WHERE id=$5 RETURNING *',
      [name, price, duration, description, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Membresía no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating membership:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/memberships/:id
 * Elimina un plan de membresía.
 */
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM memberships WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting membership:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
