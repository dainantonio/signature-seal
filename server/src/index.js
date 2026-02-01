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

// --- AI LOGIC (WV ONLY) ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  // Location check
  if (q.includes('ohio') || q.includes(' oh ')) {
    return { 
      service: "Waiting List", 
      reasoning: "We currently only serve West Virginia. We can add you to our waiting list for Ohio services.", 
      action: "contact_us" 
    };
  }

  // Hours check
  if (q.includes('hour') || q.includes('time') || q.includes('when') || q.includes('open') || q.includes('sunday') || q.includes('saturday')) {
    return {
      service: "Information",
      reasoning: "Our hours are: Mon-Tue (6pm-10pm), Wed-Fri (9am-5pm), Sat (9am-2pm). Sunday is for emergency appointments only. Appointments outside these hours are available at a special rate.",
      action: "read_faq"
    };
  }

  // Pricing check
  if (q.includes('price') || q.includes('cost') || q.includes('fee') || q.includes('charge') || q.includes('travel')) {
    return {
      service: "Pricing",
      reasoning: "Travel fee is $40 (covers first 10 miles), then $2/mile. Notary fees are $10 per stamp. I-9 verification has a $65 service fee.",
      action: "book_general"
    };
  }

  // I-9 Logic
  if (q.includes('i9') || q.includes('employment') || q.includes('authorized') || q.includes('remote')) {
    return {
      service: "I-9 Employment Verification",
      reasoning: "We act as an Authorized Representative for remote hires. The fee is $65 plus travel.",
      estimatedPrice: "$65 Service Fee + Travel",
      action: "book_general"
    };
  }

  // Default Notary
  return { 
    service: "Mobile Notary", 
    reasoning: "We provide mobile notary services across WV. Travel starts at $40, and notary stamps are $10 each.", 
    estimatedPrice: "$40 Base + $10/stamp", 
    action: "book_general" 
  };
};

app.post('/api/recommend', (req, res) => res.json(recommendService(req.body.query || '')));

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready" });

  const { name, email, service, date, time, mileage } = req.body;
  
  // Unified Travel Fee: $40.00 Base + $2.00/mile over 10 miles
  const baseAmount = 4000; 
  const productName = service.includes('I-9') ? "I-9 Travel Reservation Fee" : "Mobile Travel & Convenience Fee";

  const miles = parseInt(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  const surchargeAmount = extraMiles * 200; // $2.00 per mile (cents)

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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      automatic_tax: { enabled: false }, 
      invoice_creation: { 
        enabled: true,
        invoice_data: {
          description: "Notary services are not subject to sales tax.",
          footer: service.includes('I-9') 
            ? "I-9 Employment Verification Service Fee is collected separately at appointment." 
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

// I-9 / Notary Invoice Endpoint
app.post('/api/create-invoice', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready." });
  const { id, signatures, type } = req.body;
  try {
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    
    let amount = 1000;
    let desc = 'West Virginia Notary Fee';
    let count = parseInt(signatures) || 1;

    if (type === 'custom') { // I-9 or Custom
         amount = 2500; // $25 Service Fee for I-9
         desc = 'Professional Service Fee (I-9 / Other)';
         count = 1;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'usd', product_data: { name: desc }, unit_amount: amount },
        quantity: count,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?paid=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: booking.email,
    });
    // Send invoice link via email
    if (resend) await resend.emails.send({ from: 'onboarding@resend.dev', to: booking.email, reply_to: ADMIN_EMAIL, subject: 'Invoice: Service Fees', html: `<p>Please pay your service fees here: <a href="${session.url}">Pay Now</a></p>` });
    res.json({ message: "Invoice sent!" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT}`));
