import express from 'express';
import Routine from '../models/Routine.js';

const router = express.Router();

// GET all routines
router.get('/', async (req, res) => {
    try {
        const routines = await Routine.find().sort({ createdAt: -1 });
        res.json(routines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new routine
router.post('/', async (req, res) => {
    const routine = new Routine({
        name: req.body.name,
        level: req.body.level,
        focus: req.body.focus,
        icon: req.body.icon
    });

    try {
        const newRoutine = await routine.save();
        res.status(201).json(newRoutine);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
