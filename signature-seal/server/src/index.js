// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- HELPER: SIMULATE EMAIL SENDING ---
const sendConfirmationEmail = async (email, name, date, time) => {
  // In a real app, this would use Resend or SendGrid
  console.log(`[EMAIL MOCK] Sending confirmation to ${email} for ${name} at ${time} on ${date}`);
  return new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
};

// --- AI LOGIC ---
const recommendService = (query) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('mortgage') || lowerQuery.includes('refinance') || lowerQuery.includes('closing') || lowerQuery.includes('loan')) {
    return {
      service: "Loan Signing",
      confidence: "High",
      reasoning: "Real estate transactions require a certified Loan Signing Agent.",
      estimatedPrice: "$150 flat rate",
      action: "book_loan"
    };
  }
  
  if (lowerQuery.includes('will') || lowerQuery.includes('trust') || lowerQuery.includes('poa') || lowerQuery.includes('power')) {
    return {
      service: "Estate Planning",
      confidence: "High",
      reasoning: "These documents are sensitive. We recommend our Estate Planning service.",
      estimatedPrice: "$35 + witness fees",
      action: "book_general"
    };
  }

  return {
    service: "Mobile Notary",
    confidence: "Medium",
    reasoning: "A standard Mobile Notary appointment fits your needs.",
    estimatedPrice: "$35 + travel",
    action: "book_general"
  };
};

// --- ROUTES ---

app.post('/api/recommend', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });
    setTimeout(() => res.json(recommendService(query)), 800);
  } catch (error) {
    res.status(500).json({ error: "AI failed" });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;

    // VALIDATION
    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes, address }
    });
    
    // Simulate Email
    await sendConfirmationEmail(email, name, date, time);

    console.log(`✅ Booking confirmed for ${name}`);
    res.json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
});

app.get('/api/bookings', async (req, res) => {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(bookings);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});