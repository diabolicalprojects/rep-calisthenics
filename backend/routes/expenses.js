import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { ExpenseSchema } from '../validators/schemas.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize(['admin', 'developer']));

// ─── CATEGORÍAS ──────────────────────────────────────────────────────────────

/**
 * GET /api/expenses/categories
 * Lista todas las categorías de gastos.
 * IMPORTANTE: Esta ruta debe definirse ANTES de GET /expenses/:id
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM expense_categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching expense categories:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/expenses/categories
 * Crea una nueva categoría de gasto.
 */
router.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre es requerido' });
  try {
    const result = await query(
      'INSERT INTO expense_categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating expense category:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/expenses/categories/:id
 * Elimina una categoría de gasto.
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    await query('DELETE FROM expense_categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    console.error('Error deleting expense category:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── GASTOS ───────────────────────────────────────────────────────────────────

/**
 * GET /api/expenses
 * Lista gastos, opcionalmente filtrados por rango de fechas.
 */
router.get('/', async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let queryText = 'SELECT * FROM expenses';
    let params = [];
    if (startDate && endDate) {
      queryText += ' WHERE date BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    queryText += ' ORDER BY date DESC';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/expenses
 * Registra un nuevo gasto con validación Zod.
 */
router.post('/', async (req, res) => {
  try {
    const validated = ExpenseSchema.parse(req.body);
    const recordedBy = validated.recorded_by?.length === 36
      ? validated.recorded_by
      : req.user.id;

    // Auto-registrar la categoría si es nueva
    if (validated.category) {
      await query(
        'INSERT INTO expense_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [validated.category]
      );
    }

    const result = await query(
      'INSERT INTO expenses (description, amount, category, recorded_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [validated.description, validated.amount, validated.category, recordedBy]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
