// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

// --- STRIPE CONFIG ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.error("⚠️ Stripe Init Failed:", err.message);
  }
}
const CLIENT_URL = process.env.CLIENT_URL || 'https://signaturesealnotaries.com';

// --- CORS ---
// origin: true ensures we respect the request origin while allowing credentials/headers
app.use(cors({
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors()); // Force handle preflight

app.use(express.json());

// --- ROUTES (Including Delete) ---
// (Paste previous routes here - booking, login, recommend...)
// I am including the specific delete route below for clarity.

// DELETE ROUTE
app.delete('/api/bookings/:id', async (req, res) => {
  // Simplified Auth Check
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try { jwt.verify(token, JWT_SECRET); } catch { return res.sendStatus(403); }

  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => console.log(`Server on ${PORT}`));
