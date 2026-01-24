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

// --- EMAIL SETUP ---
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

// --- STRIPE SETUP ---
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const CLIENT_URL = process.env.CLIENT_URL || 'https://signaturesealnotaries.com';

// --- CORS CONFIGURATION ---
app.use(cors({
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// --- NOTIFICATION HELPER ---
const sendAdminNotification = async (email, name, service, date, time, address, notes, paid = false) => {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: ADMIN_EMAIL, 
      reply_to: email, 
      subject: `New Booking: ${name} - ${service} ${paid ? '(PAID)' : ''}`,
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid ${paid ? '#27ae60' : '#3498db'}; padding-bottom: 10px;">
            ${paid ? '✅ Payment Received' : '📅 New Appointment Request'}
          </h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Email:</strong> ${email}</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📍 Meeting Address:</strong></p>
            <p style="margin: 5px 0 0 0; color: #555;">${address || 'Not provided'}</p>
          </div>
          <div style="background: #fdfaf6; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f39c12;">
            <p style="margin: 0; color: #d35400;"><strong>📝 Instructions / Notes:</strong></p>
            <p style="margin: 5px 0 0 0; color: #444;">${notes || 'None'}</p>
          </div>
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

// --- AI LOGIC (UPDATED FOR WV RON) ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  // 1. Payment / Billing Questions
  if (q.includes('pay') || q.includes('cost') || q.includes('price') || q.includes('card') || q.includes('invoice')) {
    return {
      service: "Payment Options",
      reasoning: "We accept Stripe (Online), Square (In-Person), and Electronic Invoices. Payment is due at or before service.",
      estimatedPrice: "Service Fee + State Notary Fees",
      action: "read_policy"
    };
  }

  // 2. Loan Signing
  if (q.includes('loan') || q.includes('mortgage') || q.includes('closing') || q.includes('refinance')) {
    return {
      service: "Loan Signing",
      reasoning: "Real estate transactions require a certified Loan Signing Agent.",
      estimatedPrice: "$150 Service Fee (Includes printing & courier)",
      action: "book_loan"
    };
  }

  // 3. Remote Online Notary (RON) Logic - UPDATED
  if (q.includes('remote') || q.includes('online') || q.includes('ron') || q.includes('virtual')) {
    return {
      service: "Remote Online Notary (OH & WV)",
      reasoning: "We are authorized for Remote Online Notarization in both Ohio and West Virginia.",
      estimatedPrice: "$25 Online Session Fee + Notary Fees",
      action: "book_general"
    };
  }

  // 4. Default Mobile Notary
  return {
    service: "Mobile Notary",
    reasoning: "A standard mobile notary appointment. We travel to you in OH & WV.",
    estimatedPrice: "Travel/Service Fee + Separate State Fees",
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

// Create Booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    if (!name || !email || !service || !date || !time) return res.status(400).json({ error: "Missing fields" });

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    
    await sendAdminNotification(email, name, service, date, time, address, notes);
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
});

// Create Stripe Session (If configured)
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Online payment not configured" });

  try {
    const { name, email, service, date, time, notes, address } = req.body;
    // Simple logic: Loans = 15000 cents ($150), Others = 4000 cents ($40) base
    const amount = service.includes('Loan') ? 15000 : 4000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Service Deposit: ${service}`, description: `Appointment: ${date} @ ${time}` },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
      metadata: {
        customer_name: name,
        service,
        appointment_date: date,
        appointment_time: time,
        address: address || '',
        notes: notes || ''
      },
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get Bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
      // Pagination support
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

// Delete Booking (Standard)
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

// Delete Booking (Fallback POST)
app.post('/api/bookings/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted successfully via POST" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
