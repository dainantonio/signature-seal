// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// --- SECURITY ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

// --- STRIPE (Safe Initialization) ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY.trim());
    console.log("✅ STRIPE: Live and Ready.");
  } catch (err) {
    console.error("❌ STRIPE: Initialization Error:", err.message);
  }
}

// --- EMAIL ---
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'notaries@signatureseal.com';
const CLIENT_URL = 'https://signaturesealnotaries.com';

// --- CORS ---
app.use(cors({ origin: '*' })); 
app.options('*', cors());

app.use(express.json());

// --- ROUTES ---

app.get('/', (req, res) => res.send('API Online'));

// 1. STRIPE CHECKOUT
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Server is initializing Stripe. Please try again in 30 seconds." });

  const { name, email, service, date, time } = req.body;
  
  // Dynamic Pricing Logic
  let amount = 4000; // Default $40
  if (service.includes('Loan')) amount = 15000; // $150
  if (service.includes('Remote')) amount = 5000; // $50

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: service, description: `Appointment: ${date} at ${time}` },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 2. STANDARD BOOKING
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
    if (resend) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: ADMIN_EMAIL,
        subject: `New Booking: ${req.body.name}`,
        html: `<h3>New Request</h3><p>${req.body.service} for ${req.body.name} on ${req.body.date}.</p>`
      });
    }
    res.json(booking);
  } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

// 3. ADMIN GET BOOKINGS
app.get('/api/bookings', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    jwt.verify(token, JWT_SECRET);
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bookings);
  } catch (err) { res.sendStatus(403); }
});

// 4. ADMIN LOGIN
app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// 5. ADMIN DELETE
app.delete('/api/bookings/:id', async (req, res) => {
  try { await prisma.booking.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: "Deleted" }); }
  catch (err) { res.json({ message: "Deleted" }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API ready on port ${PORT}`));
