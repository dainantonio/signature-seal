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

// --- STRIPE CONFIG ---
// Get this from: https://dashboard.stripe.com/apikeys (Secret Key)
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
        <div style="font-family: sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid ${paid ? '#27ae60' : '#3498db'}; padding-bottom: 10px;">
            ${paid ? '✅ Payment Received' : '📅 New Appointment Request'}
          </h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${date} at ${time}</p>
          <p><strong>Email:</strong> ${email}</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Meeting Address:</p>
            <p style="margin: 5px 0 15px 0;">${address || 'Not provided'}</p>
            <p style="margin: 0; font-weight: bold;">Notes:</p>
            <p style="margin: 5px 0 0 0;">${notes || 'None'}</p>
          </div>
          ${paid ? '<p style="color: #27ae60; font-weight: bold;">Note: Customer has paid the booking deposit online.</p>' : ''}
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

// --- AI LOGIC (COMPLIANT) ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  // Payment Policy Question
  if (q.includes('pay') || q.includes('cost') || q.includes('price')) {
    return {
      service: "Payment Options",
      reasoning: "We accept Stripe (Online) & Square (In-Person). Invoices are itemized by Travel, Service, and State Notary Fees.",
      estimatedPrice: "Travel/Service Fee + State Fees ($5 OH / $10 WV)",
      action: "read_policy"
    };
  }

  if (q.includes('loan') || q.includes('mortgage') || q.includes('closing')) {
    return {
      service: "Loan Signing",
      reasoning: "Real estate transactions require a certified Loan Signing Agent.",
      estimatedPrice: "$150 flat rate (Includes Travel, Printing & Courier)",
      action: "book_loan"
    };
  }
  
  if (q.includes('remote') || q.includes('online') || q.includes('ron')) {
     return {
      service: "Remote Online Notary (OH & WV)",
      reasoning: "Authorized for Remote Online Notarization in OH & WV.",
      estimatedPrice: "$25 Platform Fee + Notary Fees",
      action: "book_general"
    };
  }

  return {
    service: "Mobile Notary",
    reasoning: "Standard mobile appointment. We travel to you.",
    estimatedPrice: "$40 Base (Travel & Service) + State Fees per stamp",
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

// Standard Booking (Pay Later)
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    if (!name || !email || !service || !date || !time) return res.status(400).json({ error: "Missing fields" });

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    
    await sendAdminNotification(email, name, service, date, time, address, notes, false);
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
});

// Create Stripe Session (COMPLIANT ITEMIZATION)
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Online payment not configured" });

  const { name, email, service, date, time, notes, address } = req.body;
  
  // Define Line Items based on Service Type
  let line_items = [];

  if (service.includes('Loan')) {
    // Loan Signing ($150 Total)
    line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Loan Signing Service', description: 'Notarization & Handling' },
          unit_amount: 10000, // $100.00
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Travel & Convenience Fee', description: 'Mobile Service, Printing & Courier' },
          unit_amount: 5000, // $50.00
        },
        quantity: 1,
      }
    ];
  } else {
    // Mobile Notary ($40 Total)
    // We break this down to protect against "overcharging for notary act" claims
    line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Mobile Travel Fee', description: 'Travel to your location (Base Radius)' },
          unit_amount: 2500, // $25.00
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Administrative Service Fee', description: 'Appointment scheduling & preparation' },
          unit_amount: 1500, // $15.00
        },
        quantity: 1,
      }
    ];
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items, // Use our compliant breakdown
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
    console.error("Stripe Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Get Bookings
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

// Delete Booking (Fallback)
app.post('/api/bookings/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted successfully via POST" });
  } catch (err) {
    if (err.code === 'P2025') return res.json({ message: "Already deleted" });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
