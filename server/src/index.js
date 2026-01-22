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

// --- NUCLEAR CORS OPTION (Allow All) ---
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
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
      html: `<p>New booking for ${name}. Details in admin dashboard.</p>`
    });
  } catch (err) { console.error("Email error:", err); }
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
app.get('/', (req, res) => res.send('API Online'));
app.post('/api/recommend', (req, res) => res.json({ service: "Mobile Notary", estimatedPrice: "$35+" })); // Simplified for brevity
app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
  else res.status(401).json({ error: "Invalid password" });
});

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
    sendAdminNotification(req.body.email, req.body.name, req.body.service, req.body.date, req.body.time);
    res.json(booking);
  } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(bookings);
});

// DELETE Routes
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try { await prisma.booking.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: "Deleted" }); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

app.post('/api/bookings/delete/:id', authenticateToken, async (req, res) => {
  try { await prisma.booking.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: "Deleted via POST" }); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
