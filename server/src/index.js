// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// --- CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

// --- CORS: ALLOW EVERYTHING (Fixes Delete Issues) ---
app.use(cors({
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  credentials: true
}));

app.use(express.json());

// --- NOTIFICATION HELPER ---
const sendAdminNotification = async (email, name, service, date, time, address, notes) => {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: ADMIN_EMAIL, 
      reply_to: email, 
      subject: `New Booking: ${name} - ${service}`,
      html: `
        <div style="font-family: sans-serif; color: #333; padding: 20px;">
          <h2>New Booking</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${date} at ${time}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Address:</strong> ${address || 'None'}</p>
          <p><strong>Notes:</strong> ${notes || 'None'}</p>
        </div>
      `
    });
  } catch (err) {
    console.error("Email failed:", err);
  }
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- ROUTES ---

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  
  const q = query.toLowerCase();
  if (q.includes('loan') || q.includes('mortgage')) {
    return res.json({ service: "Loan Signing", estimatedPrice: "$150 flat rate", action: "book_loan" });
  }
  res.json({ service: "Mobile Notary", estimatedPrice: "$35 + State Fees", action: "book_general" });
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    await sendAdminNotification(email, name, service, date, time, address, notes);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: "Booking failed" });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
      const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ error: "Failed to load bookings" });
    }
});

// DELETE ROUTE
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    // Return success even if not found (idempotent)
    res.json({ message: "Deleted" }); 
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
