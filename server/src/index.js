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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 
const CLIENT_URL = 'https://signaturesealnotaries.com';

// --- INITIALIZE STRIPE ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try { stripe = stripeLib(process.env.STRIPE_SECRET_KEY.trim()); } catch(e) {}
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

app.use(cors({ origin: '*' })); 
app.options('*', cors());
app.use(express.json());

// --- AI LOGIC (WV ONLY) ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('loan') || q.includes('mortgage')) {
    return {
      service: "Loan Signing",
      reasoning: "Loan packages require specialized agents.",
      estimatedPrice: "Call for Quote",
      action: "book_general"
    };
  }

  return {
    service: "Mobile Notary",
    reasoning: "We travel to you in Huntington/Tri-State.",
    estimatedPrice: "$10/stamp (State Fee) + Travel Fee (Starts at $40)",
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

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready" });

  const { name, email, service, date, time } = req.body;
  
  // COMPLIANT PRICING BREAKDOWN
  // Total: $50 ($10 Notary + $40 Travel Base)
  const line_items = [
    {
      price_data: { currency: 'usd', product_data: { name: 'WV State Notary Fee (Per Act)' }, unit_amount: 1000 }, // $10.00
      quantity: 1,
    },
    {
      price_data: { currency: 'usd', product_data: { name: 'Mobile Travel & Service Fee' }, unit_amount: 4000 }, // $40.00
      quantity: 1,
    }
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
      metadata: { name, service, date, time }
    });
    res.json({ url: session.url });
  } catch (e) {
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
            html: `<p>New booking: ${req.body.name}</p><p>Service: ${req.body.service}</p><p>Note: Check Admin Portal for details.</p>` 
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

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT}`));
