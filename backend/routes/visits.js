import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/visits
 * Lista las últimas 50 visitas.
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM visits ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching visits:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/visits
 * Registra la visita de un miembro y actualiza su última visita.
 */
router.post('/', async (req, res) => {
  const { member_id, member_name } = req.body;
  try {
    // Validar que el UUID tiene el formato correcto antes de insertar
    const validMemberId = (member_id && member_id.length === 36) ? member_id : null;

    await query('INSERT INTO visits (member_id, member_name) VALUES ($1, $2)', [validMemberId, member_name]);
    if (validMemberId) {
      await query('UPDATE members SET last_visit=NOW() WHERE id=$1', [validMemberId]);
    }
    res.sendStatus(201);
  } catch (err) {
    console.error('Error recording visit:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
