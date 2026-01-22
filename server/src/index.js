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

// --- CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

// --- ROBUST CORS CONFIGURATION ---
const corsOptions = {
  origin: true, // Allow any origin while respecting credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly list DELETE
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// FORCE HANDLE PREFLIGHT REQUESTS (The Sledgehammer Fix)
app.options('*', cors(corsOptions));

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
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">New Appointment Request</h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Email:</strong> ${email}</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📍 Meeting Address:</strong></p>
            <p style="margin: 5px 0 0 0; color: #555;">${address || 'Not provided'}</p>
          </div>
          <div style="background: #fdfaf6; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f39c12;">
            <p style="margin: 0; color: #d35400;"><strong>📝 Instructions / Notes:</strong></p>
            <p style="margin: 5px 0 0 0; color: #444;">${notes || 'None'}</p>
          </div>
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

// --- AI LOGIC ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  if (q.includes('loan') || q.includes('mortgage') || q.includes('closing')) {
    return {
      service: "Loan Signing",
      reasoning: "Real estate transactions require a certified Loan Signing Agent.",
      estimatedPrice: "$150 flat rate",
      action: "book_loan"
    };
  }
  return {
    service: "Mobile Notary",
    reasoning: "A standard Mobile Notary appointment based on distance.",
    estimatedPrice: "$40 Minimum (Travel + 1 Stamp). Mileage fee applies for 10+ miles.",
    action: "book_general"
  };
};

// --- ROUTES ---

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  res.json(recommendService(query));
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
    if (!name || !email || !service || !date || !time) return res.status(400).json({ error: "Missing fields" });

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    
    await sendAdminNotification(email, name, service, date, time, address, notes);
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
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

// DELETE ROUTE (Standard)
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

// DELETE ROUTE (Fallback POST)
// Use this if the browser/network blocks the DELETE method
app.post('/api/bookings/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted successfully via POST" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
