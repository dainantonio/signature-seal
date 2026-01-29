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
initStripe();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

app.use(cors({ origin: '*' })); 
app.options('*', cors());
app.use(express.json());

// --- AI LOGIC ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  if (q.includes('ohio') || q.includes(' oh ')) return { service: "Waiting List", reasoning: "WV only for now.", action: "read_faq" };

  if (q.includes('i9') || q.includes('employment') || q.includes('authorized')) {
    return {
      service: "I-9 Employment Verification",
      reasoning: "Authorized Representative services for remote hires.",
      estimatedPrice: "$40 Travel Base + $20 Service Fee",
      action: "book_general"
    };
  }

  return { service: "Mobile Notary", reasoning: "Standard WV appointment.", estimatedPrice: "$40 Base + $10/stamp", action: "book_general" };
};

app.post('/api/recommend', (req, res) => res.json(recommendService(req.body.query || '')));

app.post('/api/create-checkout-session', async (req, res) => {
  const stripeInstance = initStripe();
  if (!stripeInstance) return res.status(500).json({ error: "Stripe not ready." });

  const { name, email, service, date, time, mileage } = req.body;
  
  // Dynamic Pricing Logic
  let baseAmount = 4000; // $40.00 Base
  let productName = "Mobile Travel & Convenience Fee";

  const miles = parseInt(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  const surchargeAmount = extraMiles * 200; 

  const line_items = [
    {
      price_data: { 
          currency: 'usd', 
          product_data: { name: productName }, 
          unit_amount: baseAmount,
      },
      quantity: 1,
    }
  ];

  if (surchargeAmount > 0) {
      line_items.push({
        price_data: { 
            currency: 'usd', 
            product_data: { name: `Mileage Surcharge (${extraMiles} extra miles)` }, 
            unit_amount: surchargeAmount,
        },
        quantity: 1,
      });
  }

  try {
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      automatic_tax: { enabled: false }, 
      invoice_creation: { 
        enabled: true,
        invoice_data: {
          description: "Notary services are not subject to sales tax.",
          footer: service.includes('I-9') 
            ? "I-9 Service Fee ($20) is collected separately at appointment." 
            : "State notary fees ($10/stamp) are collected separately at appointment."
        }
      },
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
      metadata: { name, service, date, time, mileage }
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ... [Rest of bookings/login/delete routes kept identical] ...
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
        if (resend) await resend.emails.send({ from: 'onboarding@resend.dev', to: ADMIN_EMAIL, reply_to: req.body.email, subject: 'New Booking', html: `<p>New booking: ${req.body.name}</p>` });
        res.json(booking);
    } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

app.get('/api/bookings', async (req, res) => {
    try { const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }); res.json({ data: bookings }); } 
    catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

app.post('/api/bookings/delete/:id', async (req, res) => {
  try { await prisma.booking.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: "Deleted" }); }
  catch (err) { res.json({ message: "Deleted" }); }
});

app.post('/api/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
    else res.status(401).json({ error: "Invalid password" });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT} (WV Scope)`));
