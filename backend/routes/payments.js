import express from 'express';
import Payment from '../models/Payment.js';

const router = express.Router();

// GET all payments
router.get('/', async (req, res) => {
    try {
        const payments = await Payment.find().sort({ date: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new payment
router.post('/', async (req, res) => {
    const payment = new Payment({
        memberName: req.body.memberName,
        concept: req.body.concept,
        amount: req.body.amount,
        status: req.body.status
    });

    try {
        const newPayment = await payment.save();
        res.status(201).json(newPayment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET some basic metrics for dashboard
router.get('/metrics', async (req, res) => {
    try {
        const payments = await Payment.find();

        let monthlyRevenue = 0;
        let pendingDebts = 0;

        payments.forEach(p => {
            if (p.status === 'Pagado') {
                monthlyRevenue += p.amount;
            } else {
                pendingDebts += p.amount;
            }
        });

        res.json({
            monthlyRevenue,
            pendingDebts
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
