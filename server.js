const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(__dirname, 'data.json');
const EXCEL_FILE = path.join(__dirname, 'dadeserasmus.xlsx');

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Setup
const mongoUri = process.env.MONGODB_URI;
let useMongo = false;

if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => {
            console.log('✅ Connected to MongoDB');
            useMongo = true;
            // Optionally migrate data if DB is empty
            migrateDataIfNeeded();
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

// GET /data — return current student data
app.get('/data', async (req, res) => {
    try {
        if (useMongo) {
            const students = await Student.find({});
            return res.json(students);
        }
        // Fallback to local file
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Could not read data' });
    }
});

// POST /add — add a new student
app.post('/add', async (req, res) => {
    const { nom, carrera, origen, telefon } = req.body;

    if (!nom || !carrera || !origen) {
        return res.status(400).json({ error: 'Missing fields: nom, carrera, origen' });
    }

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
            console.log(`✓ Added to DB: ${nom}`);
            return res.json({ success: true, student });
        }

        // Local File logic
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        data.push(newStudentData);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        saveToExcel(data);
        console.log(`✓ Added to File: ${nom}`);
        res.json({ success: true, student: newStudentData });
    } catch (err) {
        console.error('Error adding student:', err);
        res.status(500).json({ error: 'Could not save student' });
    }
});

// POST /update — update student records (full sync/edit)
app.post('/update', async (req, res) => {
    const { students } = req.body;

    if (!Array.isArray(students)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    try {
        if (useMongo) {
            // Full replace strategy for simplicity (matches local file behavior)
            await Student.deleteMany({});
            const docs = students.map(s => ({
                ...s,
                carrera: normalizeCarrera(s.carrera)
            }));
            await Student.insertMany(docs);
            console.log(`✓ Updated DB with ${docs.length} records`);
            return res.json({ success: true });
        }

        // Local File logic
        fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');
        saveToExcel(students);
        console.log(`✓ Updated File with ${students.length} records`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating students:', err);
        res.status(500).json({ error: 'Could not update data' });
    }
});

async function migrateDataIfNeeded() {
    try {
        const count = await Student.countDocuments();
        if (count === 0 && fs.existsSync(DATA_FILE)) {
            console.log('Migrating local data to MongoDB...');
            const localData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            if (localData.length > 0) {
                await Student.insertMany(localData);
                console.log(`Migrated ${localData.length} students.`);
            }
        }
    } catch (e) { console.error('Migration failed:', e); }
}

function saveToExcel(students) {
    try {
        const wb = XLSX.utils.book_new();
        const excelData = students.map(s => ({
            'Nom': s.nom,
            'Carrera': s.carrera,
            'Origen': s.origen,
            'Telèfon': s.telefon || ""
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, 'Dades');
        XLSX.writeFile(wb, EXCEL_FILE);
    } catch (e) { console.error('Excel save failed:', e); }
}

// Start server with fallback ports
const startServer = (portToTry) => {
    const server = app.listen(portToTry, () => {
        console.log(`\n🎓 Erasmus Dashboard running at http://localhost:${portToTry}\n`);
    });
    
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${portToTry} is in use, trying ${portToTry + 1}...`);
            startServer(portToTry + 1);
        } else {
            throw err;
        }
    });
};

startServer(PORT);
