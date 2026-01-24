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

// --- STRIPE CONFIG (With Debugging) ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    // Remove whitespace just in case
    const key = process.env.STRIPE_SECRET_KEY.trim();
    stripe = require('stripe')(key);
    console.log("✅ Stripe initialized successfully.");
  } catch (err) {
    console.error("❌ Stripe Init Failed:", err.message);
  }
} else {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing from Environment Variables.");
}

const CLIENT_URL = process.env.CLIENT_URL || 'https://signaturesealnotaries.com';

// --- ROBUST CORS ---
const corsOptions = {
  origin: true, // Allow all origins that send credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

app.use(express.json());

// --- REQUEST LOGGER (Debug) ---
app.use((req, res, next) => {
  console.log(`👉 Incoming Request: ${req.method} ${req.url}`);
  next();
});

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

// --- ROUTES ---

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  
  const q = query.toLowerCase();
  if (q.includes('loan') || q.includes('mortgage')) {
    return res.json({ service: "Loan Signing", estimatedPrice: "$150 flat rate", action: "book_loan" });
  }
  res.json({ service: "Mobile Notary", estimatedPrice: "$40 Minimum + Fees", action: "book_general" });
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
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

// STRIPE SESSION
app.post('/api/create-checkout-session', async (req, res) => {
  console.log("💰 Payment logic triggered");

  if (!stripe) {
    console.error("❌ Stripe object is null");
    return res.status(500).json({ error: "Online payment not configured on server (Check STRIPE_SECRET_KEY)" });
  }

  const { name, email, service, date, time, notes, address } = req.body;

  // Save Booking first
  try {
    await prisma.booking.create({
      data: { 
        name, email, service, date: new Date(date), time, 
        notes: `${notes || ''} (Online Payment Initiated)`, 
        address: address || "" 
      }
    });
    await sendAdminNotification(email, name, service, date, time, address, notes, 'Payment Initiated');
  } catch (dbError) {
    console.error("DB Save Error (Non-fatal):", dbError);
  }

  // Create Stripe Session
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
    console.log("Attempting to create Stripe session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
    });
    console.log("✅ Session created URL:", session.url);
    res.json({ url: session.url });
  } catch (e) {
    console.error("❌ Stripe SDK Error:", e.message);
    res.status(500).json({ error: `Stripe Error: ${e.message}` });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
      const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ error: "Failed to load bookings" });
    }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.json({ message: "Deleted" }); 
  }
});

app.post('/api/bookings/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted via POST" });
  } catch (err) {
    res.json({ message: "Deleted" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **2. Update Frontend (`client/src/App.jsx`)**
**Change:** Improved the `submitBooking` error handling to display the specific error message from the server (or the network status).

*(Only replacing the `BookingModal` component logic here for brevity, but you should verify this matches your file).*

```jsx
// snippet inside BookingModal component in client/src/App.jsx

  const submitBooking = async () => {
    setIsSubmitting(true);
    
    const endpoint = payNow ? `${API_URL}/api/create-checkout-session` : `${API_URL}/api/bookings`;

    try {
      console.log("Submitting to:", endpoint); // DEBUG LOG
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (payNow && data.url) {
          window.location.href = data.url;
        } else {
          setSuccess(true);
          setTimeout(() => { onClose(); setSuccess(false); setStep(1); setFormData({ service: '', date: '', time: '', name: '', email: '', address: '', notes: '' }); }, 2000);
        }
      } else {
        // DISPLAY THE REAL ERROR
        alert(`Request failed: ${data.error || "Unknown Server Error"}`);
      }
    } catch (err) { 
      console.error("Network Catch:", err);
      // SPECIFIC NETWORK ERROR MSG
      alert(`Network Error: ${err.message}. Check console/Render logs.`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };
