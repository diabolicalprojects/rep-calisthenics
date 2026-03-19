import express from 'express';
import { getPool } from '../config/db.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { TransactionSchema } from '../validators/schemas.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/transactions
 * Lista transacciones. Solo accesible por Admin/Developer.
 */
router.get('/', authorize(['admin', 'developer']), async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let queryText = 'SELECT * FROM transactions';
    let params = [];
    if (startDate && endDate) {
      queryText += ' WHERE timestamp BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    queryText += ' ORDER BY timestamp DESC';
    const pool = getPool();
    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/transactions
 * Registra una venta POS o suscripción. Usa transacción DB para atomicidad.
 */
router.post('/', async (req, res) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const { payment_method, cashier_name, items, type, register_id } = TransactionSchema.parse(req.body);
    
    await client.query('BEGIN');

    let calculatedTotal = 0;
    const processedItems = [];

    // 1. Validar y Recalcular (Seguridad: No confiar en el precio del cliente)
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.type === 'retail') {
            const dbItem = await client.query('SELECT name, price, quantity FROM inventory WHERE id = $1', [item.id]);
            if (dbItem.rowCount === 0) throw new Error(`Producto no encontrado: ${item.name}`);
            if (dbItem.rows[0].quantity < item.quantity) throw new Error(`Stock insuficiente para ${dbItem.rows[0].name}`);
            
            calculatedTotal += Number(dbItem.rows[0].price) * item.quantity;
            processedItems.push({ ...item, price: dbItem.rows[0].price });
            
            // Descontar inventario inmediatamente para validación atómica
            await client.query('UPDATE inventory SET quantity = quantity - $1 WHERE id = $2', [item.quantity, item.id]);
        } else if (item.type === 'sub') {
            const planResult = await client.query(
                'SELECT m.price, m.duration_days FROM memberships m JOIN members mem ON mem.plan = m.name WHERE mem.id = $1', 
                [item.member_id]
            );
            if (planResult.rowCount === 0) throw new Error(`Plan no encontrado para el socio`);
            calculatedTotal += Number(planResult.rows[0].price);
            processedItems.push(item);
        } else if (item.type === 'visit') {
            const price = item.id === 'visit-promo' ? 80 : 100; // Lógica de negocio para visitas
            calculatedTotal += price;
            processedItems.push(item);
        }
      }
    }

    // 2. Prevenir cargo duplicado por suscripción
    if (type === 'subscription') {
      const memberItem = items.find(i => i.member_id);
      if (memberItem?.member_id) {
        const dupCheck = await client.query(
          "SELECT id FROM payments WHERE member_id = $1 AND concept = 'Renovación de Membresía' AND date >= CURRENT_DATE",
          [memberItem.member_id]
        );
        if (dupCheck.rows.length > 0) throw new Error('Este miembro ya realizó un pago de suscripción hoy.');
      }
    }

    // 3. Registrar la transacción con el TOTAL REAL
    const txResult = await client.query(
      'INSERT INTO transactions (total_amount, payment_method, cashier_name, items, type, register_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [calculatedTotal, payment_method, cashier_name, JSON.stringify(processedItems), type, register_id || null]
    );

    // 4. Registrar en historial de pagos
    const memberItem = items?.find(i => i.member_id);
    const memberId = memberItem ? memberItem.member_id : null;
    const memberName = memberItem ? memberItem.member_name : (type === 'subscription' ? 'Socio' : 'Cliente General');

    await client.query(
      'INSERT INTO payments (member_name, member_id, concept, amount, status, date) VALUES ($1, $2, $3, $4, $5, NOW())',
      [memberName, memberId, type === 'subscription' ? 'Renovación de Membresía' : 'Venta POS', calculatedTotal, 'Pagado']
    );

    // 5. Actualizar expiración DINÁMICA
    if (type === 'subscription' && memberId) {
      await client.query(`
        UPDATE members 
        SET status = 'Activo', 
            expiration_date = CURRENT_DATE + (SELECT COALESCE(duration_days, 30) FROM memberships WHERE name = members.plan LIMIT 1) * INTERVAL '1 day' 
        WHERE id = $1`, 
        [memberId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(txResult.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
