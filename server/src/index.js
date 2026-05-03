// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const twilio = require('twilio');

const app = express();
const prisma = new PrismaClient();

// Use system port (required for deployment) or fallback to 3001
const PORT = process.env.PORT || 3001;

// --- SECURITY CONFIG ---
// Reads from environment variables, falls back to defaults for dev
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 
if (process.env.NODE_ENV === 'production' && (ADMIN_PASSWORD === 'admin' || JWT_SECRET === 'dev-secret-key-123')) {
  throw new Error("Security misconfiguration: set strong ADMIN_PASSWORD and JWT_SECRET in production.");
}

// --- SAFER EMAIL CONFIG ---
// Only initialize Resend if the key exists, otherwise use a placeholder to prevent crashes
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;
const TWILIO_FROM_PHONE = process.env.TWILIO_FROM_PHONE || null;

app.use(cors());
app.use(express.json());

// --- HELPER: SEND REAL EMAIL VIA RESEND ---
const sendConfirmationEmail = async (email, name, service, date, time) => {
  if (!resend) {
    console.log("⚠️ Email skipped: RESEND_API_KEY not set.");
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

const sendConfirmationSms = async (phone, date, time) => {
  if (!twilioClient || !TWILIO_FROM_PHONE || !phone) return;
  try {
    await twilioClient.messages.create({
      body: `Signature Seal: Your appointment is confirmed for ${date} at ${time}. Reply STOP to opt out.`,
      from: TWILIO_FROM_PHONE,
      to: phone
    });
  } catch (err) {
    console.error("SMS send failed:", err.message);
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

// --- AGENTIC AI LOGIC ---
const recommendService = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Default payload structure
  let response = {
      service: "Mobile Notary Service",
      confidence: "Medium",
      reasoning: "A standard Mobile Notary appointment fits your needs.",
      estimatedPrice: "$40 Travel + $5-$10 per stamp",
      action: "book_general",
      prefillLocation: ""
  };

  // 1. Extract Location Context
  if (lowerQuery.includes('hospital') || lowerQuery.includes('st. mary') || lowerQuery.includes('cabell')) {
      response.prefillLocation = "Hospital / Medical Facility";
  } else if (lowerQuery.includes('jail') || lowerQuery.includes('detention')) {
      response.prefillLocation = "Detention Center";
  } else if (lowerQuery.includes('nursing') || lowerQuery.includes('assisted')) {
      response.prefillLocation = "Assisted Living Facility";
  }

  // 2. Determine Service Type
  if (lowerQuery.includes('inspect') || lowerQuery.includes('property') || lowerQuery.includes('photo')) {
      response.service = "Field Inspection";
      response.confidence = "High";
      response.reasoning = "We can complete your Field Inspection. Our flat rate includes photo documentation.";
      response.estimatedPrice = "$50 Base + Mileage";
  } 
  else if (lowerQuery.includes('mortgage') || lowerQuery.includes('loan') || lowerQuery.includes('closing')) {
      response.service = "Loan Signing";
      response.confidence = "High";
      response.reasoning = "Real estate transactions require a certified Loan Signing Agent.";
      response.estimatedPrice = "$150 flat rate";
      response.action = "book_loan";
  }
  else if (lowerQuery.includes('i9') || lowerQuery.includes('i-9') || lowerQuery.includes('employment')) {
      response.service = "I-9 Employment Verification";
      response.confidence = "High";
      response.reasoning = "We act as an Authorized Representative for remote hires.";
      response.estimatedPrice = "$40 Travel + $25 Service";
  }
  else if (lowerQuery.includes('will') || lowerQuery.includes('trust') || lowerQuery.includes('poa') || lowerQuery.includes('power')) {
      response.reasoning = "These are sensitive documents. Please ensure you have any necessary witnesses ready.";
  }

  return response;
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
    // Simulate slight AI thinking delay
    setTimeout(() => res.json(recommendService(query)), 600);
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
    const { name, email, service, date, time, notes, address, phone } = req.body;

    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes, address }
    });
    
    // Send Real Email Notification
    await sendConfirmationEmail(email, name, service, date, time);
    await sendConfirmationSms(phone, date, time);
    
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
