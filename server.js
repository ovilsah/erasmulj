const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const EXCEL_FILE = path.join(__dirname, 'dadeserasmus.xlsx');

// Middleware
app.use(express.json());
// Servir archivos estaticos directamente si no se usan rutas de Vercel/siempre
app.use(express.static(__dirname));

// MongoDB Setup
const mongoUri = process.env.MONGODB_URI;
let useMongo = false;

if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => {
            console.log('✅ Connected to MongoDB');
            useMongo = true;
        })
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// Student Schema
const studentSchema = new mongoose.Schema({
    nom: String,
    carrera: String,
    origen: String,
    telefon: String
});
const Student = mongoose.model('Student', studentSchema);

// Helper to normalize engineering career names
function normalizeCarrera(carrera) {
    if (!carrera) return "";
    return carrera.replace(/Enginyeria|Ingenieria|Ingenería|Ingeneria|Ing\./gi, "Ingeniería").trim();
}

// GET /data
app.get('/data', async (req, res) => {
    try {
        if (useMongo) {
            const students = await Student.find({});
            return res.json(students);
        }
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            res.json(data);
        } else {
            res.json([]);
        }
    } catch (err) {
        res.status(500).json({ error: 'Could not read data' });
    }
});

// POST /add
app.post('/add', async (req, res) => {
    const { nom, carrera, origen, telefon } = req.body;
    if (!nom || !carrera || !origen) return res.status(400).json({ error: 'Missing fields' });

    const newStudentData = {
        nom: nom.trim(),
        carrera: normalizeCarrera(carrera),
        origen: origen.trim(),
        telefon: (telefon || "").trim()
    };

    try {
        if (useMongo) {
            const student = new Student(newStudentData);
            await student.save();
            return res.json({ success: true, student });
        }
        
        // Local File handling (will catch error if readonly fs)
        let data = [];
        if (fs.existsSync(DATA_FILE)) {
             data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        data.push(newStudentData);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        try { saveToExcel(data); } catch (e) {} // Excel fail handled silently on servers
        res.json({ success: true, student: newStudentData });

    } catch (err) {
        if (useMongo && err.code !== 'EROFS') {
             console.error('DB Error:', err);
             return res.status(500).json({ error: 'DB Error' });
        } else if (err.code === 'EROFS') {
             // Read-only filesystem error (Vercel without Mongo)
             console.log('Read-only filesystem, cannot save file locally.');
             return res.status(500).json({ error: 'Cannot save: Configuring MongoDB is required on this server.' });
        }
        console.error('Error adding student:', err);
        res.status(500).json({ error: 'Could not save student' });
    }
});

// POST /update
app.post('/update', async (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ error: 'Invalid data' });

    try {
        const normalized = students.map(s => ({ ...s, carrera: normalizeCarrera(s.carrera) }));
        
        if (useMongo) {
            await Student.deleteMany({});
            await Student.insertMany(normalized);
            return res.json({ success: true });
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
        try { saveToExcel(normalized); } catch (e) {}
        res.json({ success: true });
    } catch (err) {
         if (err.code === 'EROFS') {
             return res.status(500).json({ error: 'Cannot save: Configuring MongoDB is required on this server.' });
        }
        console.error('Error updating:', err);
        res.status(500).json({ error: 'Could not update data' });
    }
});

function saveToExcel(students) {
    const wb = XLSX.utils.book_new();
    const excelData = students.map(s => ({
        'Nom': s.nom, 'Carrera': s.carrera, 'Origen': s.origen, 'Telèfon': s.telefon || ""
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Dades');
    XLSX.writeFile(wb, EXCEL_FILE);
}

// For local dev
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

// Export for Vercel
module.exports = app;
