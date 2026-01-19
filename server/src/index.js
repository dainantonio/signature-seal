// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

console.log("🚀 Server process started...");

const app = express();
const prisma = new PrismaClient();

// Render and other platforms inject the PORT variable. 
// We must use process.env.PORT or the deployment will fail.
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

// --- EMAIL SETUP (CRASH PROTECTION) ---
// We check if the key exists first. If not, we log a warning instead of crashing.
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'notary@example.com';

app.use(cors());
app.use(express.json());

// --- EMAIL HELPER ---
const sendAdminNotification = async (booking) => {
  if (!resend) {
    console.log("⚠️ Email Notification Skipped: RESEND_API_KEY not found in environment.");
    return;
  }
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ADMIN_EMAIL,
      subject: `New Booking: ${booking.name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>New Notary Request</h2>
          <p><strong>Client:</strong> ${booking.name}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>When:</strong> ${booking.date} at ${booking.time}</p>
          <p><strong>Contact:</strong> ${booking.email}</p>
        </div>
      `
    });
    console.log("📧 Admin notification email sent successfully.");
  } catch (err) {
    console.error("❌ Resend Email Error:", err.message);
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

// --- AI PRICING LOGIC ---
const getServiceRecommendation = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('loan') || q.includes('mortgage') || q.includes('closing')) {
    return {
      service: "Loan Signing",
      reasoning: "Real estate and loan packages require specialized certified agents.",
      estimatedPrice: "$150 flat rate (includes printing & courier)",
      action: "book_loan"
    };
  }
  
  if (q.includes('will') || q.includes('trust') || q.includes('poa')) {
    return {
      service: "Estate Planning",
      reasoning: "Wills and Trusts are sensitive documents. We recommend our specialized mobile service.",
      estimatedPrice: "$35 base + state fees ($5 OH / $10 WV per stamp)",
      action: "book_general"
    };
  }

  return {
    service: "Mobile Notary",
    reasoning: "A standard mobile notary appointment covers most general documents.",
    estimatedPrice: "$35 base + state fees ($5 OH / $10 WV per stamp)",
    action: "book_general"
  };
};

// --- API ROUTES ---

// Health Check (Critical for Render "Live" status)
app.get('/', (req, res) => {
  console.log("📍 Health check ping received.");
  res.send('Signature Seal API - Status: Active');
});

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  res.json(getServiceRecommendation(query));
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes, address }
    });
    
    // Attempt to notify admin via email
    sendAdminNotification(booking);
    
    console.log(`✅ New booking created for ${name}`);
    res.json(booking);
  } catch (error) {
    console.error("❌ Database Booking Error:", error);
    res.status(500).json({ error: "Failed to process booking." });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

// START THE SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SUCCESS: Signature Seal Server is listening on port ${PORT}`);
  console.log(`🔗 Health check available at: http://0.0.0.0:${PORT}/`);
});