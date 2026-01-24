// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// --- CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';
const CLIENT_URL = process.env.CLIENT_URL || 'https://signaturesealnotaries.com';

// --- STRIPE ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try { stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); } catch (e) { console.error("Stripe init failed"); }
}

// --- CORS (PERMISSIVE) ---
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());

app.use(express.json());

// --- ROUTES ---
app.get('/', (req, res) => res.send('API Online'));

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
    if (resend) {
        await resend.emails.send({
            from: 'onboarding@resend.dev', to: ADMIN_EMAIL, reply_to: req.body.email,
            subject: `New Booking: ${req.body.name}`,
            html: `<p>New booking received from ${req.body.name}. Service: ${req.body.service}</p>`
        });
    }
    res.json(booking);
  } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Notary Service' }, unit_amount: 4000 }, quantity: 1 }],
            mode: 'payment',
            success_url: `${CLIENT_URL}?success=true`,
            cancel_url: `${CLIENT_URL}?canceled=true`,
        });
        res.json({ url: session.url });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bookings', async (req, res) => {
  // Simplified Auth
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try { jwt.verify(token, JWT_SECRET); } catch { return res.sendStatus(403); }

  const page = parseInt(req.query.page) || 1;
  const limit = 9;
  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.booking.count()
  ]);
  res.json({ data: bookings, pagination: { total, page, totalPages: Math.ceil(total / limit) } });
});

// DELETE
app.delete('/api/bookings/:id', async (req, res) => {
  // Simplified Auth
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try { jwt.verify(token, JWT_SECRET); } catch { return res.sendStatus(403); }

  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted" });
  } catch (err) { res.json({ message: "Already deleted" }); }
});

// FALLBACK DELETE
app.post('/api/bookings/delete/:id', async (req, res) => {
  // Simplified Auth
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try { jwt.verify(token, JWT_SECRET); } catch { return res.sendStatus(403); }
  
  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted via POST" });
  } catch (err) { res.json({ message: "Already deleted" }); }
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
  else res.status(401).json({ error: "Invalid password" });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
