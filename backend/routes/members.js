import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import Member from '../models/Member.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// GET all members
router.get('/', async (req, res) => {
    try {
        const members = await Member.find().sort({ createdAt: -1 });
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new member
router.post('/', async (req, res) => {
    const member = new Member({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        plan: req.body.plan,
        status: req.body.status
    });

    try {
        const newMember = await member.save();
        res.status(201).json(newMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST upload excel
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo' });

        // Leer el archivo de excel
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Parsear datos y guardarlos
        const membersToInsert = data.map(row => ({
            name: row.Nombre || row.name || row.Name || 'Sin Nombre',
            email: row.Correo || row.email || row.Email || 'correo@mail.com',
            phone: row.Telefono || row.phone || row.Phone || '0000000000',
            plan: ['Mensual', 'Anual', 'Elite'].includes(row.Plan) ? row.Plan : 'Mensual',
            status: ['Activo', 'Inactivo'].includes(row.Estado) ? row.Estado : 'Activo'
        }));

        await Member.insertMany(membersToInsert);

        res.status(200).json({ message: `${membersToInsert.length} miembros importados correctamente.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error procesando el archivo Excel.' });
    }
});

export default router;
