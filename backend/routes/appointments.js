import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/public/appointments?date=YYYY-MM-DD
 * Endpoint PÚBLICO: solo expone los horarios ocupados, sin datos de miembros.
 */
router.get('/appointments', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'El parámetro date es requerido' });
  try {
    const result = await query('SELECT time FROM appointments WHERE date = $1', [date]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching public appointments:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── AGENDA PROTEGIDA ─────────────────────────────────────────────────────────

router.use(authenticateToken);

/**
 * GET /api/appointments
 * Lista citas filtradas por fecha, incluyendo pendientes.
 */
router.get('/', async (req, res) => {
  const { date } = req.query;
  try {
    let queryText = 'SELECT * FROM appointments ORDER BY date ASC, time ASC';
    let params = [];
    if (date) {
      queryText = "SELECT * FROM appointments WHERE date = $1 OR status = 'Pendiente' ORDER BY date ASC, time ASC";
      params = [date];
    }
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/appointments
 * Crea una nueva cita. Endpoint público (para formulario de reserva externa).
 */
router.post('/', async (req, res) => {
  const { title, memberName, time, date, duration, status, phone, email } = req.body;
  try {
    const notes = (phone || email) ? `Teléfono: ${phone || 'N/A'}, Email: ${email || 'N/A'}` : '';
    const result = await query(
      'INSERT INTO appointments (title, member_name, time, date, duration, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, memberName, time, date, duration, status || 'Pendiente', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/appointments/:id/status
 * Actualiza solo el estado de una cita.
 */
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await query('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PATCH /api/appointments/:id
 * Actualiza campos específicos de una cita de forma dinámica.
 */
router.patch('/:id', async (req, res) => {
  const fields = req.body;
  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }
  try {
    const keys = Object.keys(fields);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const params = [...Object.values(fields), req.params.id];
    await query(`UPDATE appointments SET ${setClause} WHERE id = $${params.length}`, params);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error patching appointment:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
