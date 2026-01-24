// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const stripeLib = require('stripe');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// --- CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 
const CLIENT_URL = 'https://signaturesealnotaries.com';

// --- DIAGNOSTIC LOGGING ---
console.log("🛠️  BOOT: Checking environment variables...");
if (process.env.STRIPE_SECRET_KEY) {
    console.log("✅ BOOT: STRIPE_SECRET_KEY detected (Length: " + process.env.STRIPE_SECRET_KEY.length + ")");
} else {
    console.log("❌ BOOT: STRIPE_SECRET_KEY is MISSING in process.env");
}

// --- INITIALIZE STRIPE ---
let stripe = null;
const initStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
        try {
            stripe = stripeLib(process.env.STRIPE_SECRET_KEY.trim());
            console.log("✅ STRIPE: Initialized successfully.");
        } catch (e) {
            console.error("❌ STRIPE: Failed to initialize:", e.message);
        }
    }
    return stripe;
};

// Try initial load
initStripe();

app.use(cors({ origin: '*' })); 
app.options('*', cors());
app.use(express.json());

// --- ROUTES ---

// 1. DIAGNOSTIC ROUTE (Check this in your browser: https://signature-seal.onrender.com/api/debug)
app.get('/api/debug', (req, res) => {
    res.json({
        stripe_initialized: !!stripe,
        env_key_exists: !!process.env.STRIPE_SECRET_KEY,
        env_key_length: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
        node_version: process.version
    });
});

app.get('/', (req, res) => res.send('API Online'));

app.post('/api/create-checkout-session', async (req, res) => {
  // Try to re-initialize if it failed at boot
  const stripeInstance = initStripe();
  
  if (!stripeInstance) {
    return res.status(500).json({ 
        error: "Server is initializing Stripe. Please try a 'Manual Deploy' > 'Clear Build Cache' in Render Dashboard." 
    });
  }

  const { name, email, service, date, time } = req.body;
  let amount = 4000; 
  if (service.includes('Loan')) amount = 15000;
  if (service.includes('Remote')) amount = 5000;

  try {
    const session = await stripeInstance.checkout.sessions.create({
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
    console.error("Stripe Session Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// [Rest of your routes: /api/bookings, /api/login, etc.]
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
        res.json(booking);
    } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

app.post('/api/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
    else res.status(401).json({ error: "Invalid password" });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT}`));
