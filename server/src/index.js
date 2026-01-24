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

// --- STRIPE SETUP ---
// We use a try/catch here so the whole server doesn't crash if the key is bad/missing
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.error("⚠️ Stripe failed to initialize:", err.message);
  }
}
const CLIENT_URL = process.env.CLIENT_URL || 'https://signaturesealnotaries.com';

// --- ROBUST CORS CONFIGURATION ---
const corsOptions = {
  origin: true, // Allow any origin that sends credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// 1. Apply CORS to all requests
app.use(cors(corsOptions));

// 2. FORCE HANDLE PREFLIGHT (OPTIONS) REQUESTS
// This fixes the "Network Error" on Delete/Payment
app.options('*', cors(corsOptions));

app.use(express.json());

// --- NOTIFICATION HELPER ---
const sendAdminNotification = async (email, name, service, date, time, address, notes, status = 'New Request') => {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: ADMIN_EMAIL, 
      reply_to: email, 
      subject: `New Booking: ${name} - ${service} [${status}]`,
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid ${status.includes('Payment') ? '#27ae60' : '#3498db'}; padding-bottom: 10px;">
            ${status.includes('Payment') ? '✅ Payment Initiated' : '📅 New Appointment Request'}
          </h2>
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

// --- ROUTES ---

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  
  // Simple AI logic to prevent complexity
  const q = query.toLowerCase();
  if (q.includes('loan') || q.includes('mortgage')) {
    return res.json({ service: "Loan Signing", estimatedPrice: "$150 flat rate", action: "book_loan" });
  }
  res.json({ service: "Mobile Notary", estimatedPrice: "Travel + Notary Fees", action: "book_general" });
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// 1. STANDARD BOOKING (Pay Later)
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    if (!name || !email || !service || !date || !time) return res.status(400).json({ error: "Missing fields" });

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    
    await sendAdminNotification(email, name, service, date, time, address, notes, 'Pay Later');
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
});

// 2. STRIPE CHECKOUT (Pay Now)
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    console.error("Stripe Error: API Key missing or invalid.");
    return res.status(500).json({ error: "Online payment is currently unavailable." });
  }

  const { name, email, service, date, time, notes, address } = req.body;
  
  // A. SAVE BOOKING FIRST (Prevent data loss)
  try {
    await prisma.booking.create({
      data: { 
        name, 
        email, 
        service, 
        date: new Date(date), 
        time, 
        notes: `${notes || ''} (Online Payment Initiated)`, 
        address: address || "" 
      }
    });
    
    await sendAdminNotification(email, name, service, date, time, address, notes, 'Payment Initiated');

  } catch (dbError) {
    console.error("DB Save Error during payment:", dbError);
    // Continue to payment even if DB save fails, but log it
  }

  // B. CREATE STRIPE SESSION
  let line_items = [];
  if (service.includes('Loan')) {
    line_items = [
      { price_data: { currency: 'usd', product_data: { name: 'Loan Signing Service' }, unit_amount: 10000 }, quantity: 1 },
      { price_data: { currency: 'usd', product_data: { name: 'Travel & Convenience Fee' }, unit_amount: 5000 }, quantity: 1 }
    ];
  } else {
    // Mobile Notary ($40 breakdown)
    line_items = [
      { price_data: { currency: 'usd', product_data: { name: 'Mobile Travel Fee' }, unit_amount: 2500 }, quantity: 1 },
      { price_data: { currency: 'usd', product_data: { name: 'Administrative Service Fee' }, unit_amount: 1500 }, quantity: 1 }
    ];
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
      metadata: { customer_name: name, service, date, time }
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe Session Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET BOOKINGS
app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 9;
      const skip = (page - 1) * limit;

      const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.booking.count()
      ]);

      res.json({ data: bookings, pagination: { total, page, totalPages: Math.ceil(total / limit) } });
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
