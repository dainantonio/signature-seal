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

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// --- EMAIL NOTIFICATION (FIXED TEMPLATE) ---
const sendAdminNotification = async (email, name, service, date, time, address, notes) => {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ADMIN_EMAIL,
      reply_to: email,
      subject: `New Booking: ${name} - ${service}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #c59d5f; padding-bottom: 10px;">New Appointment Request</h2>
          
          <p><strong>Customer:</strong> ${name}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date/Time:</strong> ${date} at ${time}</p>
          <p><strong>Email:</strong> ${email}</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; margin-top: 20px; border-radius: 5px;">
            <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Meeting Address</p>
            <p style="margin: 5px 0 15px 0; font-size: 16px;">${address || 'No address provided'}</p>
            
            <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Notes / Instructions</p>
            <p style="margin: 5px 0 0 0; font-size: 16px;">${notes || 'None'}</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Reply to this email to contact the customer directly.
          </p>
        </div>
      `
    });
    console.log("📧 Admin notification sent.");
  } catch (err) {
    console.error("❌ Email error:", err);
  }
};

// --- AUTH & LOGIC ---
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

const recommendService = (query) => {
  const q = query.toLowerCase();
  if (q.includes('loan') || q.includes('mortgage') || q.includes('closing')) {
    return { service: "Loan Signing", reasoning: "Requires certified agent.", estimatedPrice: "$150 flat rate", action: "book_loan" };
  }
  return { service: "Mobile Notary", reasoning: "Standard appointment.", estimatedPrice: "$35 base + state fees", action: "book_general" };
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

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, service, date, time, notes, address } = req.body;
    
    // Validate inputs
    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const booking = await prisma.booking.create({
      data: { name, email, service, date: new Date(date), time, notes: notes || "", address: address || "" }
    });
    
    // Call email function with ALL fields
    await sendAdminNotification(email, name, service, date, time, address, notes);
    
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
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
