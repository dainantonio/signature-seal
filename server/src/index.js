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

// --- AI LOGIC (WV ONLY) ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('ohio') || q.includes(' oh ')) return { service: "Waiting List", reasoning: "WV only for now.", action: "read_faq" };

  if (q.includes('courier') || q.includes('delivery') || q.includes('filing')) {
    return {
      service: "Legal Document Courier",
      reasoning: "Secure transport for court filings and real estate docs.",
      estimatedPrice: "$55 Flat Rate + Mileage",
      action: "book_general"
    };
  }

  if (q.includes('i9') || q.includes('employment') || q.includes('authorized')) {
    return {
      service: "I-9 Employment Verification",
      reasoning: "We act as an Authorized Representative for remote hires.",
      estimatedPrice: "$60 Service Fee + Travel",
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
  
  // --- DYNAMIC PRICING LOGIC ---
  let baseAmount = 4000; // Default: Mobile Notary ($40.00)
  let productName = "Mobile Travel & Convenience Fee";

  // 1. I-9 Verification ($60 Flat)
  if (service.includes('I-9')) {
      baseAmount = 6000; 
      productName = "I-9 Verification Service & Travel Fee";
  }
  
  // 2. Field Inspection ($50 Flat)
  if (service.includes('Inspection')) {
      baseAmount = 5000;
      productName = "Field Inspection Service";
  }

  // 3. Legal Courier ($55 Flat) <--- NEW UPDATE
  if (service.includes('Courier')) {
      baseAmount = 5500;
      productName = "Secure Legal Courier Service";
  }

  // --- MILEAGE SURCHARGE ---
  const miles = parseInt(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  const surchargeAmount = extraMiles * 200; // $2.00 per mile

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
          footer: service.includes('I-9') || service.includes('Courier') || service.includes('Inspection')
            ? "Service Fee collected. Thank you for your business." 
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

// ... [Rest of the file remains standard: bookings, login, delete, invoice] ...

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

app.post('/api/create-invoice', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready." });
  const { id, signatures, type } = req.body;
  try {
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    
    let amount = 1000;
    let desc = 'West Virginia Notary Fee';
    let count = parseInt(signatures) || 1;

    if (type === 'custom') { 
         amount = 2500; 
         desc = 'Professional Service Fee (I-9 / Other)';
         count = 1;
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'usd', product_data: { name: desc }, unit_amount: amount },
        quantity: count,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?paid=true`,
      cancel_url: `${CLIENT_URL}`,
      customer_email: booking.email,
    });
    if (resend) await resend.emails.send({ from: 'onboarding@resend.dev', to: booking.email, reply_to: ADMIN_EMAIL, subject: 'Invoice: Service Fees', html: `<p>Please pay your service fees here: <a href="${session.url}">Pay Now</a></p>` });
    res.json({ message: "Invoice sent!" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT} (WV Scope)`));
