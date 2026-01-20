// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

// Render Requirement: Use the port provided by the environment
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 

// --- EMAIL SETUP ---
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'notary@example.com';

app.use(cors({
  origin: '*', // Allows Vercel frontend to communicate with Render backend
  credentials: true
}));
app.use(express.json());

// --- NOTIFICATION HELPER ---
const sendAdminNotification = async (email, name, service, date, time, address, notes) => {
  if (!resend) {
    console.log("⚠️ Email skipped: RESEND_API_KEY not set.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: ADMIN_EMAIL, 
      reply_to: email, 
      subject: `New Booking: ${name} - ${service}`,
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">New Appointment Request</h2>
          
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Requested Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Customer Email:</strong> ${email}</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            <p style="margin: 0; color: #2980b9;"><strong>📍 Meeting Address:</strong></p>
            <p style="margin: 5px 0 0 0; color: #444; font-size: 15px;">
              ${address && address.trim() !== "" ? address : "<em>No address provided by customer</em>"}
            </p>
          </div>

          <div style="background: #fdfaf6; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f39c12;">
            <p style="margin: 0; color: #d35400;"><strong>📝 Instructions / Notes:</strong></p>
            <p style="margin: 5px 0 0 0; color: #444; font-size: 15px;">
              ${notes && notes.trim() !== "" ? notes : "<em>No instructions provided by customer</em>"}
            </p>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Tip: You can reply directly to this email to contact the customer.
          </p>
        </div>
      `
    });

    if (error) {
      console.error("Resend Error:", error);
    } else {
      console.log(`📧 Notification email sent to ${ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error("Email processing failed:", err);
  }
};

// --- ROUTES ---

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  
  const q = query.toLowerCase();
  if (q.includes('loan') || q.includes('mortgage')) {
    res.json({ 
        service: "Loan Signing", 
        reasoning: "Loan packages require specialized agents.", 
        estimatedPrice: "$150 flat rate", 
        action: "book_loan" 
    });
  } else {
    res.json({ 
        service: "Mobile Notary", 
        reasoning: "Standard notary request.", 
        estimatedPrice: "$35 base + fees ($5 OH / $10 WV per stamp)", 
        action: "book_general" 
    });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    // Destructuring all fields from the request body
    const { name, email, service, date, time, notes, address } = req.body;

    console.log("📥 New Booking Received:", { name, email, service, date, time, address, notes });

    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save to database
    const booking = await prisma.booking.create({
      data: { 
        name, 
        email, 
        service, 
        date: new Date(date), 
        time, 
        notes: notes || "", 
        address: address || "" 
      }
    });
    
    // Send notification passing all fields including address and notes
    await sendAdminNotification(email, name, service, date, time, address, notes);
    
    res.json(booking);
  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ error: "Could not save booking" });
  }
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// CRITICAL: Bind to '0.0.0.0' for Render/Cloud deployment
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server live on port ${PORT}`);
});
