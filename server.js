const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const EXCEL_FILE = path.join(__dirname, 'dadeserasmus.xlsx');

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Helper to normalize engineering career names
function normalizeCarrera(carrera) {
    if (!carrera) return "";
    // Normalize various forms to "Ingeniería"
    return carrera.replace(/Enginyeria|Ingenieria|Ingenería|Ingeneria|Ing\./gi, "Ingeniería").trim();
}

// GET /data — return current student data
app.get('/data', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Could not read data file' });
    }
});

// POST /add — add a new student
app.post('/add', (req, res) => {
    const { nom, carrera, origen, telefon } = req.body;

    if (!nom || !carrera || !origen) {
        return res.status(400).json({ error: 'Missing fields: nom, carrera, origen' });
    }

    const newStudent = {
        nom: nom.trim(),
        carrera: normalizeCarrera(carrera),
        origen: origen.trim(),
        telefon: (telefon || "").trim()
    };

    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        data.push(newStudent);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

        // Update Excel file
        saveToExcel(data);

        console.log(`✓ Added student: ${nom}`);
        res.json({ success: true, student: newStudent });
    } catch (err) {
        console.error('Error adding student:', err);
        res.status(500).json({ error: 'Could not save student' });
    }
});

// POST /update — update student records
app.post('/update', (req, res) => {
    const { students } = req.body;

    if (!Array.isArray(students)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    try {
        // Save to JSON
        fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');

        // Save to Excel
        saveToExcel(students);

        console.log(`✓ Updated ${students.length} student records`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating students:', err);
        res.status(500).json({ error: 'Could not update data' });
    }
});

function saveToExcel(students) {
    const wb = XLSX.utils.book_new();
    // Map to Excel format (uppercase keys)
    const excelData = students.map(s => ({
        'Nom': s.nom,
        'Carrera': s.carrera,
        'Origen': s.origen,
        'Telèfon': s.telefon || ""
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Dades');
    XLSX.writeFile(wb, EXCEL_FILE);
}

// Start server
app.listen(PORT, () => {
    console.log(`\n🎓 Erasmus Ljubljana 26/27 running at http://localhost:${PORT}\n`);
});
