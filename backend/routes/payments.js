import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize(['admin', 'developer']));

/**
 * GET /api/payments
 * Lista pagos, opcionalmente filtrados por rango de fechas.
 */
router.get('/', async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let queryText = 'SELECT id, member_name as "memberName", member_id as "memberId", concept, amount, status, date FROM payments';
    let params = [];
    if (startDate && endDate) {
      queryText += ' WHERE date BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    queryText += ' ORDER BY date DESC';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/payments
 * Registra un pago manual (contabilidad).
 */
router.post('/', async (req, res) => {
  const { memberName, memberId, concept, amount, status } = req.body;
  try {
    const result = await query(
      'INSERT INTO payments (member_name, member_id, concept, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [memberName, memberId, concept, amount, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
