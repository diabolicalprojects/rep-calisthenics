import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * POST /api/retention/contacts
 * Registra un intento de contacto con un socio.
 */
router.post('/contacts', async (req, res) => {
    const { member_id, type, message, status } = req.body;
    try {
        const result = await query(
            'INSERT INTO retention_contacts_log (member_id, type, message, status, recorded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [member_id, type || 'whatsapp', message || '', status || 'sent', req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error recording retention contact:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/retention/contacts/:member_id
 * Obtiene el historial de contactos por miembro.
 */
router.get('/contacts/:member_id', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM retention_contacts_log WHERE member_id = $1 ORDER BY timestamp DESC',
            [req.params.member_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching retention history:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
