import express from 'express';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// GET all appointments
router.get('/', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ time: 1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new appointment
router.post('/', async (req, res) => {
    const appointment = new Appointment({
        title: req.body.title,
        memberName: req.body.memberName,
        time: req.body.time,
        duration: req.body.duration
    });

    try {
        const newAppointment = await appointment.save();
        res.status(201).json(newAppointment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE status of appointment
router.put('/:id/status', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'No encontrado' });

        appointment.status = req.body.status;
        const updatedApp = await appointment.save();
        res.json(updatedApp);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
