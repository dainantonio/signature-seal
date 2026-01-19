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

// --- SECURITY CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

// --- EMAIL CONFIG ---
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

app.use(cors());
app.use(express.json());

// --- HELPER: SEND REAL EMAIL VIA RESEND ---
const sendConfirmationEmail = async (email, name, service, date, time) => {
  if (!process.env.RESEND_API_KEY) {
    console.log("⚠️ No RESEND_API_KEY found. Email skipped.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Default Resend test domain
      to: ADMIN_EMAIL, // This sends the notification to YOU
      subject: `New Booking: ${name} - ${service}`,
      html: `
        <h1>New Appointment Request</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Client Email:</strong> ${email}</p>
        <hr />
        <p><em>Login to your dashboard to view full details.</em></p>
      `
    });

    if (error) {
      console.error("Resend Error:", error);
    } else {
      console.log("📧 Email sent successfully:", data);
    }
  } catch (err) {
    console.error("Email System Fail:", err);
  }
};

// --- MIDDLEWARE ---
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
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('mortgage') || lowerQuery.includes('refinance') || lowerQuery.includes('closing') || lowerQuery.includes('loan') || lowerQuery.includes('deed')) {
    return {
      service: "Loan Signing",
      confidence: "High",
      reasoning: "Real estate transactions require a certified Loan Signing Agent. Our flat rate includes printing and courier service.",
      estimatedPrice: "$150 flat rate",
      action: "book_loan"
    };
  }
  
  if (lowerQuery.includes('will') || lowerQuery.includes('trust') || lowerQuery.includes('poa') || lowerQuery.includes('power') || lowerQuery.includes('healthcare')) {
    return {
      service: "Estate Planning",
      confidence: "High",
      reasoning: "These documents are sensitive. We recommend our Estate Planning service.",
      estimatedPrice: "$35 + State Fees ($5 OH / $10 WV per stamp)",
      action: "book_general"
    };
  }

  if (lowerQuery.includes('car') || lowerQuery.includes('title') || lowerQuery.includes('dmv') || lowerQuery.includes('bill of sale')) {
    return {
      service: "Vehicle Title Transfer",
      confidence: "Medium",
      reasoning: "For vehicle transactions, a standard mobile notary service is perfect.",
      estimatedPrice: "$35 + State Fees ($5 OH / $10 WV per stamp)",
      action: "book_general"
    };
  }

  return {
    service: "Mobile Notary",
    confidence: "Medium",
    reasoning: "A standard Mobile Notary appointment fits your needs.",
    estimatedPrice: "$35 + State Fees ($5 OH / $10 WV per stamp)",
    action: "book_general"
  };
};

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => {
  res.send('Signature Seal API is running.');
});

app.post('/api/recommend', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });
    setTimeout(() => res.json(recommendService(query)), 800);
  } catch (error) {
    res.status(500).json({ error: "AI failed" });
  }
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;

    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes, address }
    });
    
    // Send Real Email Notification
    await sendConfirmationEmail(email, name, service, date, time);
    
    console.log(`✅ Booking confirmed for ${name}`);
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});