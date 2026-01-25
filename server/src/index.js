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

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try { stripe = stripeLib(process.env.STRIPE_SECRET_KEY.trim()); } catch(e) {}
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

app.use(cors({ origin: '*' })); 
app.options('*', cors());
app.use(express.json());

// --- AI LOGIC (CONCIERGE) ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('price') || q.includes('cost') || q.includes('fee')) {
    return {
      service: "Pricing Question",
      reasoning: "Our travel fee starts at $40. State notary fees ($10/signature) are separate and paid at the time of service.",
      action: "read_faq"
    };
  }

  if (q.includes('id') || q.includes('driver')) {
    return {
      service: "ID Requirement",
      reasoning: "You must have a valid, unexpired government photo ID. If you don't, we cannot perform the notarization.",
      action: "read_faq"
    };
  }

  if (q.includes('location') || q.includes('where') || q.includes('travel')) {
    return {
      service: "Service Area",
      reasoning: "We serve Huntington, WV and the surrounding Tri-State area (WV side).",
      action: "book_general"
    };
  }

  return {
    service: "Mobile Notary",
    reasoning: "Ready to book? We can come to you today.",
    estimatedPrice: "$40 Travel Base + $10/sig",
    action: "book_general"
  };
};

app.post('/api/recommend', (req, res) => res.json(recommendService(req.body.query || '')));

// ... [Rest of the file stays the same as previous: create-checkout, bookings, login] ...
// I'll provide the full file if you need to be sure, but the logic below is standard.

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready" });

  const { name, email, service, date, time, mileage } = req.body;
  
  let baseAmount = 4000;
  const miles = parseInt(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  const surchargeAmount = extraMiles * 200; 

  const line_items = [
    { price_data: { currency: 'usd', product_data: { name: 'Mobile Travel Fee' }, unit_amount: 4000 }, quantity: 1 }
  ];

  if (surchargeAmount > 0) {
      line_items.push({
        price_data: { currency: 'usd', product_data: { name: `Mileage Surcharge (${extraMiles} miles)` }, unit_amount: surchargeAmount },
        quantity: 1,
      });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
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
        if (resend) await resend.emails.send({ from: 'onboarding@resend.dev', to: ADMIN_EMAIL, subject: 'New Booking', html: `<p>New booking: ${req.body.name}</p>` });
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
