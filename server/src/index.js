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

// --- AI LOGIC (WV FOCUS) ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('ohio') || q.includes('oh')) {
    return {
      service: "Waiting List",
      reasoning: "We are currently West Virginia (WV) only. Ohio services are coming very soon! Would you like to schedule for WV instead?",
      estimatedPrice: "Expansion in progress",
      action: "book_general"
    };
  }

  if (q.includes('loan') || q.includes('mortgage')) {
    return {
      service: "Loan Signing",
      reasoning: "West Virginia real estate transactions require a certified Loan Signing Agent. Our WV flat rate is $150.",
      estimatedPrice: "$150 flat rate",
      action: "book_loan"
    };
  }

  return {
    service: "Mobile Notary",
    reasoning: "Standard mobile appointment in West Virginia.",
    estimatedPrice: "$40 Base + $10 WV State Fee",
    action: "book_general"
  };
};

// --- ROUTES ---

app.get('/api/debug', (req, res) => {
    res.json({
        stripe_initialized: !!stripe,
        env_key_exists: !!process.env.STRIPE_SECRET_KEY,
        scope: "WV ONLY (OH COMING SOON)"
    });
});

app.get('/', (req, res) => res.send('Signature Seal API - Online (WV Focus)'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  res.json(recommendService(query));
});

app.post('/api/create-checkout-session', async (req, res) => {
  const stripeInstance = initStripe();
  if (!stripeInstance) return res.status(500).json({ error: "Server initializing Stripe. Try again in 30 seconds." });

  const { name, email, service, date, time } = req.body;
  
  // Dynamic Pricing Logic (WV Rates)
  let amount = 5000; // Default $50 ($40 + $10 WV Fee)
  if (service.includes('Loan')) amount = 15000; // $150

  try {
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${service} (West Virginia)`, description: `Appointment: ${date} at ${time}` },
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
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
        res.json(booking);
    } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

app.get('/api/bookings', async (req, res) => {
    try {
      const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(bookings);
    } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try { await prisma.booking.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: "Deleted" }); }
  catch (err) { res.json({ message: "Deleted" }); }
});

app.post('/api/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
    else res.status(401).json({ error: "Invalid password" });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT}`));
