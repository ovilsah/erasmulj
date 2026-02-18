const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB - Using cached connection for serverless
let conn = null;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("❌ MONGODB_URI is missing in environment variables.");
}

const connectDB = async () => {
    if (conn) return conn;
    try {
        conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // Fail fast if no connection
            socketTimeoutMS: 45000, // Close sockets after 45s
        });
        console.log("✅ New MongoDB Connection Established");
        return conn;
    } catch (e) {
        console.error("❌ MongoDB Connection Fail:", e);
        throw e;
    }
};

const studentSchema = new mongoose.Schema({
    nom: String, carrera: String, origen: String, telefon: String
});
// Avoid recompiling model if hot-reloaded
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

// Helper
function normalizeCarrera(carrera) {
    if (!carrera) return "";
    return carrera.replace(/Enginyeria|Ingenieria|Ingenería|Ingeneria|Ing\./gi, "Ingeniería").trim();
}

// Routes
app.get('/data', async (req, res) => {
    try {
        await connectDB();
        const students = await Student.find({});
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

app.post('/add', async (req, res) => {
    const { nom, carrera, origen, telefon } = req.body;
    if (!nom || !carrera || !origen) return res.status(400).json({ error: 'Missing fields' });

    try {
        await connectDB();
        const student = new Student({
            nom: nom.trim(),
            carrera: normalizeCarrera(carrera),
            origen: origen.trim(),
            telefon: (telefon || "").trim()
        });
        await student.save();
        res.json({ success: true, student });
    } catch (err) {
        res.status(500).json({ error: 'Save failed' });
    }
});

app.post('/update', async (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ error: 'Invalid data' });

    try {
        await connectDB();
        const normalized = students.map(s => ({ ...s, carrera: normalizeCarrera(s.carrera) }));
        await Student.deleteMany({});
        await Student.insertMany(normalized);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = app;
