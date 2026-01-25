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
  
  if (q.includes('ohio') || q.includes(' oh ')) {
    return {
      service: "Expansion Waiting List",
      reasoning: "We are currently West Virginia (WV) only. Ohio expansion is coming soon!",
      estimatedPrice: "Coming Soon",
      action: "read_faq"
    };
  }

  if (q.includes('loan') || q.includes('mortgage')) {
    return {
      service: "Loan Signing (WV)",
      reasoning: "West Virginia real estate closings require a certified Loan Signing Agent.",
      estimatedPrice: "$150 flat rate",
      action: "book_loan"
    };
  }

  return {
    service: "Mobile Notary (WV)",
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
        market_scope: "WV_ONLY"
    });
});

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  res.json(recommendService(query));
});

// 1. TRAVEL FEE CHECKOUT (Pre-Appointment)
app.post('/api/create-checkout-session', async (req, res) => {
  const stripeInstance = initStripe();
  if (!stripeInstance) return res.status(500).json({ error: "Stripe not ready." });

  const { name, email, service, date, time, mileage } = req.body;
  
  let amount = 4000; // $40.00 Base
  if (service.includes('Loan')) amount = 15000; 

  const miles = parseInt(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  const surchargeAmount = extraMiles * 200; 

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
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      automatic_tax: { enabled: false }, 
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

// 2. NOTARY FEE INVOICE (Post-Appointment)
app.post('/api/create-invoice', async (req, res) => {
  const stripeInstance = initStripe();
  if (!stripeInstance) return res.status(500).json({ error: "Stripe not ready." });

  // Admin sends: id (booking), signatures (count)
  const { id, signatures } = req.body;
  
  try {
    // Fetch booking to get email
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const count = parseInt(signatures) || 1;
    const amount = count * 1000; // $10.00 per stamp (in cents)

    // Create a Payment Link
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'West Virginia Notary Fee', description: 'Regulated Fee ($10.00 per stamp)' },
          unit_amount: 1000, // $10.00 unit price
        },
        quantity: count,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?paid=true`,
      cancel_url: `${CLIENT_URL}`,
      customer_email: booking.email,
    });

    // Email the link to the customer
    if (resend) {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: booking.email,
            reply_to: ADMIN_EMAIL,
            subject: 'Invoice: Signature Seal Notary Fees',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Notary Fee Invoice</h2>
                    <p>Thank you for choosing Signature Seal Notary.</p>
                    <p><strong>Signatures Notarized:</strong> ${count}</p>
                    <p><strong>Total Due:</strong> $${count * 10}.00</p>
                    <br/>
                    <a href="${session.url}" style="background: #2c3e50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pay Securely Online</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">This fee is regulated by the State of West Virginia.</p>
                </div>
            `
        });
    }

    res.json({ message: "Invoice sent successfully!" });
  } catch (e) {
    console.error("Invoice Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
        if (resend) await resend.emails.send({ 
            from: 'onboarding@resend.dev', 
            to: ADMIN_EMAIL, 
            reply_to: req.body.email,
            subject: 'New Booking', 
            html: `<p>New booking: ${req.body.name}</p><p>Service: ${req.body.service}</p><p>Mileage: ${req.body.mileage || 0} miles</p>` 
        });
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
