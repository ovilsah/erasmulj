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
    nom: String,
    carrera: String,
    origen: String,
    telefon: String,
    semestre: { type: String, enum: ['1r', '2n', 'Anual'], default: '1r' }
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
    const { nom, carrera, origen, telefon, semestre } = req.body;
    if (!nom || !carrera || !origen) return res.status(400).json({ error: 'Missing fields' });

    try {
        await connectDB();
        const student = new Student({
            nom: nom.trim(),
            carrera: normalizeCarrera(carrera),
            origen: origen.trim(),
            telefon: (telefon || "").trim(),
            semestre: semestre || '1r'
        });
        await student.save();
        res.json({ success: true, student });
    } catch (err) {
        res.status(500).json({ error: 'Save failed' });
    }
});

// Atomic Update
app.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, carrera, origen, telefon, semestre } = req.body;

    try {
        await connectDB();
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            {
                nom: nom.trim(),
                carrera: normalizeCarrera(carrera),
                origen: origen.trim(),
                telefon: (telefon || "").trim(),
                semestre: semestre || '1r'
            },
            { new: true } // Return the updated document
        );

        if (!updatedStudent) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ success: true, student: updatedStudent });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Atomic Delete
app.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await connectDB();
        const result = await Student.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = app;
