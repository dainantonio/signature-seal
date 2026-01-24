// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

// Use system port (required for deployment) or fallback to 3001
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';
const CLIENT_URL = process.env.CLIENT_URL || 'https://signaturesealnotaries.com';

// --- STRIPE INITIALIZATION (With Enhanced Debugging) ---
let stripe = null;
const rawStripeKey = process.env.STRIPE_SECRET_KEY;

if (rawStripeKey) {
  try {
    // We trim the key to ensure no accidental spaces or newlines break the SDK
    const sanitizedKey = rawStripeKey.trim();
    stripe = require('stripe')(sanitizedKey);
    console.log("✅ STRIPE STATUS: System detected the secret key and initialized correctly.");
  } catch (err) {
    console.error("❌ STRIPE STATUS: Detected key but initialization failed:", err.message);
  }
} else {
  console.error("⚠️ STRIPE STATUS: No STRIPE_SECRET_KEY found in Environment Variables.");
}

// --- CORS (PERMISSIVE FOR CONNECTION FIX) ---
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());

app.use(express.json());

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => res.send('Signature Seal API - Online and Ready.'));

// 1. LOGIN
app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// 2. STANDARD BOOKING (PAY LATER)
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    
    // Notification
    if (resend) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: ADMIN_EMAIL,
        subject: `New Booking: ${name} (${service})`,
        html: `<p>New booking request for <b>${service}</b> on <b>${date}</b> at <b>${time}</b>.</p><p>Client: ${name} (${email})</p>`
      });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: "Booking failed" });
  }
});

// 3. STRIPE CHECKOUT (PAY NOW)
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    console.error("❌ Blocked Payment Attempt: Stripe is not initialized on the server.");
    return res.status(500).json({ 
      error: "Stripe not configured. Ensure STRIPE_SECRET_KEY is set in Render Environment Variables and the service has restarted." 
    });
  }

  const { name, email, service, date, time, address } = req.body;

  // Price calculation logic
  let amount = 4000; // Default $40.00
  let productName = "Notary Service";

  if (service.includes('Loan')) {
    amount = 15000; // $150.00
    productName = "Loan Signing Service";
  } else if (service.includes('Remote')) {
    amount = 5000; // $50.00
    productName = "Remote Online Notary";
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: productName, 
            description: `${service} - Scheduled for ${date} at ${time}` 
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
      metadata: { name, service, date, time, address }
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("❌ Stripe API Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 4. GET ALL BOOKINGS (ADMIN)
app.get('/api/bookings', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    jwt.verify(token, JWT_SECRET);
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bookings);
  } catch (err) {
    res.sendStatus(403);
  }
});

// 5. DELETE BOOKING
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.json({ message: "Deleted" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
