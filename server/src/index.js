// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

// Use system port (required for deployment) or fallback to 3001
const PORT = process.env.PORT || 3001;

// --- SECURITY CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

app.use(cors());
app.use(express.json());

// --- HELPER: SIMULATE EMAIL SENDING ---
const sendConfirmationEmail = async (email, name, date, time) => {
  // TODO: Integrate SendGrid or Resend here for real production emails
  console.log(`[EMAIL MOCK] Sending confirmation to ${email} for ${name} at ${time} on ${date}`);
  return new Promise(resolve => setTimeout(resolve, 500)); 
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

// --- AI LOGIC (UPDATED FOR COMPLIANCE) ---
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

// AI Recommendation
app.post('/api/recommend', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });
    setTimeout(() => res.json(recommendService(query)), 800);
  } catch (error) {
    res.status(500).json({ error: "AI failed" });
  }
});

// Admin Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
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

    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes, address }
    });
    
    await sendConfirmationEmail(email, name, date, time);
    console.log(`✅ Booking confirmed for ${name}`);
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
});

// Get Bookings (Protected)
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