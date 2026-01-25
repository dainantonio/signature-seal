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

// --- KNOWLEDGE BASE (THE BRAIN) ---
const KNOWLEDGE_BASE = [
  {
    keywords: ["price", "cost", "fee", "much"],
    response: {
      service: "Pricing",
      reasoning: "Our Base Travel Fee is $40 (covers 10 miles). Mileage surcharge applies after 10 miles ($2.00/mile). State Notary Fees ($10/stamp) are separate and paid at the table.",
      action: "book_general"
    }
  },
  {
    keywords: ["id", "driver", "passport", "bring"],
    response: {
      service: "ID Requirements",
      reasoning: "You MUST bring a valid, unexpired government photo ID (Driver's License, Passport, or State ID). No ID = No Notarization.",
      action: "read_faq"
    }
  },
  {
    keywords: ["ohio", "oh"],
    response: {
      service: "Service Area",
      reasoning: "We currently serve West Virginia (Huntington/Tri-State) only. Ohio expansion is coming soon!",
      action: "read_faq"
    }
  },
  {
    keywords: ["hospital", "jail", "prison", "nursing"],
    response: {
      service: "Special Request",
      reasoning: "We do perform hospital and jail signings. These require special coordination. Please click 'Email Us' to discuss details.",
      action: "contact_us"
    }
  },
  {
    keywords: ["loan", "mortgage", "closing", "refinance"],
    response: {
      service: "Loan Signing",
      reasoning: "Loan packages require a certified Loan Signing Agent. We are not currently accepting loan appointments online. Please email us.",
      action: "contact_us"
    }
  }
];

// --- AI LOGIC ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  // 1. Check Knowledge Base
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some(keyword => q.includes(keyword))) {
      return entry.response;
    }
  }

  // 2. Default Fallback
  return {
    service: "Mobile Notary",
    reasoning: "I can help you book a standard Mobile Notary appointment. We come to you!",
    action: "book_general"
  };
};

// --- ROUTES ---

app.get('/api/debug', (req, res) => {
    res.json({
        stripe_initialized: !!stripe,
        env_key_exists: !!process.env.STRIPE_SECRET_KEY,
        market_scope: "WV_ONLY",
        ohio_status: "COMING_SOON"
    });
});

app.get('/', (req, res) => res.send('Signature Seal API - Online (WV Only Mode)'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  res.json(recommendService(query));
});

app.post('/api/create-checkout-session', async (req, res) => {
  const stripeInstance = initStripe();
  if (!stripeInstance) return res.status(500).json({ error: "Server initializing Stripe. Try again in 30 seconds." });

  const { name, email, service, date, time, mileage } = req.body;
  
  // Dynamic Pricing Logic (WV Standard Rates)
  let amount = 4000; // $40.00 Base
  if (service.includes('Loan')) amount = 15000; 

  // Mileage Surcharge Logic
  const miles = parseInt(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  const surchargeAmount = extraMiles * 200; // $2.00 per mile (cents)

  const line_items = [
    {
      price_data: { 
          currency: 'usd', 
          product_data: { name: `${service} (Base Travel Fee)` }, 
          unit_amount: amount,
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      automatic_tax: { enabled: false }, // TAX DISABLED
      invoice_creation: { 
        enabled: true,
        invoice_data: {
          description: "Notary services are not subject to sales tax.",
          footer: "State notary fees ($10/stamp) are collected separately at appointment."
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

app.post('/api/bookings', async (req, res) => {
    try {
        const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
        res.json(booking);
    } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

app.get('/api/bookings', async (req, res) => {
    try {
      const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
      res.json({ data: bookings });
    } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
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
