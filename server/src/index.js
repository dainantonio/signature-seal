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

// 1. EMAILS DESTINATION (Where you receive bookings)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sseal.notary@gmail.com';

// 2. EMAILS SENDER (What clients see)
// Now that DNS is verified, set this in Render to: bookings@signaturesealnotaries.com
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

// --- INITIALIZE SERVICES ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try { stripe = stripeLib(process.env.STRIPE_SECRET_KEY.trim()); } catch(e) {}
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// --- TWILIO SETUP (SMS) ---
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log("✅ Twilio: Initialized for SMS.");
    } catch (e) {
        console.error("❌ Twilio Init Failed:", e.message);
    }
}

app.use(cors({ origin: '*' })); 
app.options('*', cors());
app.use(express.json());

// --- HELPER: GENERATE GOOGLE CALENDAR LINK ---
const generateCalendarLink = (name, service, date, time, address) => {
    // Creates a "Click to Add" link for Google Calendar
    const start = new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0,8);
    const details = `Service: ${service}\nClient: ${name}\nLocation: ${address}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Notary:+${encodeURIComponent(service)}&dates=${start}/${start}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(address)}`;
};

// --- HELPER: SEND SMS (Twilio) ---
const sendSMS = async (message) => {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER || !process.env.MY_PHONE_NUMBER) {
        // Silent fail if not configured yet
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
        email_sender: SENDER_EMAIL,
        stripe_active: !!stripe,
        twilio_active: !!twilioClient
    });
});

app.get('/', (req, res) => res.send('Signature Seal API - Online'));

app.post('/api/recommend', (req, res) => {
    const q = req.body.query.toLowerCase();
    // WV Only Logic
    if (q.includes('ohio') || q.includes(' oh ')) return res.json({ service: "Waiting List", reasoning: "WV only for now.", action: "read_faq" });
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
        
        // 1. Send Email (From verified domain)
        if (resend) {
            const calLink = generateCalendarLink(name, service, date, time, address);
            await resend.emails.send({ 
                from: SENDER_EMAIL, // Now dynamic
                to: ADMIN_EMAIL, 
                reply_to: email, // Reply goes to customer
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

        // 2. Send SMS (If configured)
        await sendSMS(`🔔 New Booking: ${name} for ${date} @ ${time}.`);

        res.json(booking);
    } catch (err) { res.status(500).json({ error: "Booking failed" }); }
});

// [Keep existing GET/DELETE/LOGIN/INVOICE routes]
// Including Invoice Route as requested for future use
app.post('/api/create-invoice', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready." });
  const { id, signatures } = req.body;
  try {
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    const count = parseInt(signatures) || 1;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'usd', product_data: { name: 'West Virginia Notary Fee' }, unit_amount: 1000 },
        quantity: count,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?paid=true`,
      cancel_url: `${CLIENT_URL}`,
      customer_email: booking.email,
    });
    // Send invoice link via email
    if (resend) await resend.emails.send({ from: SENDER_EMAIL, to: booking.email, reply_to: ADMIN_EMAIL, subject: 'Invoice: Notary Fees', html: `<p>Please pay your notary fees here: <a href="${session.url}">Pay Now</a></p>` });
    res.json({ message: "Invoice sent!" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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
