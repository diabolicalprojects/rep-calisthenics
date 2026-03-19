import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/cash-register/active
 * Obtiene la caja abierta actual para el usuario o globalmente.
 */
router.get('/active', async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM cash_registers WHERE status = 'open' ORDER BY opening_time DESC LIMIT 1"
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error('Error fetching active register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/cash-register/open
 * Abre una nueva caja.
 */
router.post('/open', async (req, res) => {
  const { opening_balance, notes } = req.body;
  if (opening_balance === undefined) return res.status(400).json({ error: 'Saldo inicial es requerido' });

  try {
    // Verificar si ya hay una caja abierta
    const active = await query("SELECT id FROM cash_registers WHERE status = 'open'");
    if (active.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una caja abierta. Debe cerrarla primero.' });
    }

    const result = await query(
      'INSERT INTO cash_registers (opening_balance, cashier_id, cashier_name, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [opening_balance, req.user.id, req.user.name || 'Admin', notes || '', 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error opening register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/cash-register/close
 * Cierra la caja actual.
 */
router.post('/close', async (req, res) => {
  const { id, closing_balance, notes } = req.body;
  try {
    const result = await query(
      "UPDATE cash_registers SET status = 'closed', closing_balance = $1, closing_time = NOW(), notes = notes || $2 WHERE id = $3 AND status = 'open' RETURNING *",
      [closing_balance || 0, notes ? ` | Cierre: ${notes}` : '', id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Caja no encontrada o ya cerrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error closing register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
