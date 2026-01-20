// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

// Use system port (required for deployment) or fallback to 3001
const PORT = process.env.PORT || 3001;

// --- SECURITY CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

// --- SAFER EMAIL CONFIG ---
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

app.use(cors({
  origin: '*', 
  credentials: true
}));
app.use(express.json());

// --- HELPER: SEND EMAIL ---
const sendConfirmationEmail = async (email, name, service, date, time, address, notes) => {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ADMIN_EMAIL, 
      reply_to: email,
      subject: `New Booking: ${name} - ${service}`,
      html: `<p>New booking for <strong>${service}</strong> on ${date} at ${time}.</p><p>Address: ${address}</p><p>Notes: ${notes}</p>`
    });
  } catch (err) { console.error("Email failed:", err); }
};

// --- MIDDLEWARE ---
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
app.get('/', (req, res) => res.send('Signature Seal API is running.'));

app.post('/api/recommend', (req, res) => {
  const q = (req.body.query || "").toLowerCase();
  if (q.includes('loan') || q.includes('mortgage')) {
    res.json({ service: "Loan Signing", estimatedPrice: "$150 flat rate", action: "book_loan" });
  } else {
    res.json({ service: "Mobile Notary", estimatedPrice: "$35 + Fees", action: "book_general" });
  }
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
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
    sendConfirmationEmail(email, name, service, date, time, address, notes);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: "Booking failed" });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(bookings);
});

// --- NEW DELETE ROUTE ---
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
