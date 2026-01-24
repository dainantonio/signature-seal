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

// --- CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';
const CLIENT_URL = process.env.CLIENT_URL || 'https://signaturesealnotaries.com';

// --- STRIPE CONFIG ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.error("⚠️ Stripe Init Failed:", err.message);
  }
}

// --- CORS ---
app.use(cors({
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors()); // Force handle preflight

app.use(express.json());

// --- NOTIFICATION HELPER ---
const sendAdminNotification = async (email, name, service, date, time, address, notes, status = 'New Request') => {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: ADMIN_EMAIL, 
      reply_to: email, 
      subject: `New Booking: ${name} - ${service} [${status}]`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>${status}</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${date} at ${time}</p>
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>Notes:</strong> ${notes}</p>
        </div>
      `
    });
  } catch (err) {
    console.error("Email failed:", err);
  }
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AI LOGIC ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('pay') || q.includes('cost') || q.includes('price')) {
    return {
      service: "Payment Options",
      reasoning: "We accept Stripe (Online) & Square (In-Person).",
      estimatedPrice: "Service Fee + State Notary Fees",
      action: "read_policy"
    };
  }

  if (q.includes('loan') || q.includes('mortgage') || q.includes('closing')) {
    return {
      service: "Loan Signing",
      reasoning: "Real estate transactions require a certified Loan Signing Agent.",
      estimatedPrice: "$150 flat rate",
      action: "book_loan"
    };
  }
  
  if (q.includes('remote') || q.includes('online')) {
     return {
      service: "Remote Online Notary (OH & WV)",
      reasoning: "Authorized for RON in OH & WV.",
      estimatedPrice: "$25 Platform Fee + Notary Fees",
      action: "book_general"
    };
  }

  return {
    service: "Mobile Notary",
    reasoning: "Standard mobile appointment.",
    estimatedPrice: "$40 Base + State Fees",
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

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// 1. STANDARD BOOKING
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    if (!name || !email || !service || !date || !time) return res.status(400).json({ error: "Missing fields" });

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    
    await sendAdminNotification(email, name, service, date, time, address, notes, 'Pay Later');
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
});

// 2. STRIPE CHECKOUT
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Online payment not configured" });

  const { name, email, service, date, time, notes, address } = req.body;
  
  try {
    // Save booking first
    await prisma.booking.create({
      data: { 
        name, email, service, date: new Date(date), time, 
        notes: `${notes || ''} (Online Payment Initiated)`, 
        address: address || "" 
      }
    });
    await sendAdminNotification(email, name, service, date, time, address, notes, 'Payment Initiated');
  } catch (dbError) {
    console.error("DB Save Error:", dbError);
  }

  // Determine Price
  let line_items = [];
  if (service.includes('Loan')) {
    line_items = [
      { price_data: { currency: 'usd', product_data: { name: 'Loan Signing Service' }, unit_amount: 10000 }, quantity: 1 },
      { price_data: { currency: 'usd', product_data: { name: 'Travel & Convenience Fee' }, unit_amount: 5000 }, quantity: 1 }
    ];
  } else {
    line_items = [
      { price_data: { currency: 'usd', product_data: { name: 'Mobile Travel Fee' }, unit_amount: 2500 }, quantity: 1 },
      { price_data: { currency: 'usd', product_data: { name: 'Administrative Service Fee' }, unit_amount: 1500 }, quantity: 1 }
    ];
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

// GET BOOKINGS
app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 9;
      const skip = (page - 1) * limit;

      const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.booking.count()
      ]);

      res.json({ data: bookings, pagination: { total, page, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
      res.status(500).json({ error: "Failed to load bookings" });
    }
});

// DELETE Routes
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/delete/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted via POST" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
