// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const stripeLib = require('stripe');
const twilio = require('twilio');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// --- CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 
const CLIENT_URL = 'https://signaturesealnotaries.com';

// Update this to your real email to ensure defaults work
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sseal.notary@gmail.com';

// --- INITIALIZE SERVICES ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try { stripe = stripeLib(process.env.STRIPE_SECRET_KEY.trim()); } catch(e) {}
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// --- TWILIO SETUP ---
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log("✅ Twilio: Initialized.");
    } catch (e) {
        console.error("❌ Twilio Init Failed:", e.message);
    }
}

app.use(cors({ origin: '*' })); 
app.options('*', cors());
app.use(express.json());

// --- HELPER: GENERATE GOOGLE CALENDAR LINK ---
const generateCalendarLink = (name, service, date, time, address) => {
    // Basic approximation of start/end times
    // In a real app, you'd parse the 'time' string carefully. 
    // This creates a "All Day" link or defaults to the date provided.
    const start = new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0,8);
    const details = `Service: ${service}%0AClient: ${name}%0ALocation: ${address}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Notary:+${encodeURIComponent(service)}&dates=${start}/${start}&details=${details}&location=${encodeURIComponent(address)}`;
};

// --- HELPER: SEND SMS (Twilio) ---
const sendSMS = async (message) => {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER || !process.env.MY_PHONE_NUMBER) {
        console.log("⚠️ SMS Skipped: Twilio vars missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, MY_PHONE_NUMBER)");
        return;
    }
    try {
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.MY_PHONE_NUMBER // Your personal cell
        });
        console.log("📱 SMS Sent.");
    } catch (e) {
        console.error("❌ SMS Failed:", e.message);
    }
};

// --- ROUTES ---

app.get('/api/debug', (req, res) => {
    res.json({
        email_target: ADMIN_EMAIL,
        stripe_active: !!stripe,
        twilio_active: !!twilioClient
    });
});

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
    // ... [Keep existing AI Logic] ...
    // Simplified for brevity in this update, ensure you keep the full logic
    const q = req.body.query.toLowerCase();
    if (q.includes('ohio')) return res.json({ service: "Waiting List", reasoning: "WV only for now.", action: "read_faq" });
    res.json({ service: "Mobile Notary", reasoning: "We travel to you in WV.", estimatedPrice: "$40 Base + Fees", action: "book_general" });
});

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready" });

  const { name, email, service, date, time, mileage } = req.body;
  
  let baseAmount = 4000;
  if (service.includes('Loan')) baseAmount = 15000;
  
  const miles = parseInt(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  const surchargeAmount = extraMiles * 200; 

  const line_items = [
    { price_data: { currency: 'usd', product_data: { name: 'Mobile Travel Fee' }, unit_amount: baseAmount }, quantity: 1 }
  ];

  if (surchargeAmount > 0) {
      line_items.push({
        price_data: { currency: 'usd', product_data: { name: `Mileage Surcharge (${extraMiles} miles)` }, unit_amount: surchargeAmount }, quantity: 1,
      });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
      metadata: { name, service, date, time }
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { name, email, service, date, time, address, notes, mileage } = req.body;
        const booking = await prisma.booking.create({ data: { name, email, service, date: new Date(date), time, notes, address } });
        
        // 1. Send Email (Now with Calendar Link)
        if (resend) {
            const calLink = generateCalendarLink(name, service, date, time, address);
            await resend.emails.send({ 
                from: 'onboarding@resend.dev', 
                to: ADMIN_EMAIL, 
                reply_to: email,
                subject: `New Booking: ${name}`, 
                html: `
                    <h2>New Booking Received</h2>
                    <p><strong>Client:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                    <p><strong>Service:</strong> ${service}</p>
                    <p><strong>When:</strong> ${date} @ ${time}</p>
                    <p><strong>Where:</strong> ${address}</p>
                    <p><strong>Miles:</strong> ${mileage || 0}</p>
                    <p><strong>Notes:</strong> ${notes}</p>
                    <br/>
                    <a href="${calLink}" style="background:#2c3e50;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">📅 Add to Google Calendar</a>
                ` 
            });
        }

        // 2. Send SMS (If Twilio Configured)
        await sendSMS(`🔔 Signature Seal: New booking from ${name} for ${date} at ${time}. Service: ${service}.`);

        res.json(booking);
    } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

// [Keep existing GET/DELETE/LOGIN routes]
app.get('/api/bookings', async (req, res) => {
    try { const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }); res.json({ data: bookings }); } 
    catch (err) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/bookings/delete/:id', async (req, res) => {
    try { await prisma.booking.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: "Deleted" }); }
    catch (err) { res.json({ message: "Deleted" }); }
});

app.post('/api/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
    else res.status(401).json({ error: "Invalid password" });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT}`));
