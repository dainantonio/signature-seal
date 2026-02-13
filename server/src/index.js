// filename: server/src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const stripeLib = require('stripe');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"; 
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-123"; 
const CLIENT_URL = 'https://signaturesealnotaries.com';

let stripe = null;
const initStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
        try {
            stripe = stripeLib(process.env.STRIPE_SECRET_KEY.trim());
            console.log("✅ STRIPE: Initialized successfully.");
        } catch (e) {
            console.error("❌ STRIPE: Failed to initialize:", e.message);
        }
    }
    return stripe;
};
initStripe();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'bookings@signaturesealnotaries.com';

app.use(cors({ origin: '*' })); 
app.options('*', cors());
app.use(express.json());

// --- AI LOGIC ---
const recommendService = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('ohio') || q.includes(' oh ')) return { service: "Mobile Notary (WV/OH)", reasoning: "Yes! We are fully commissioned in Ohio (South Point, Chesapeake, etc.).", estimatedPrice: "$40 Travel Reservation + $5/stamp", action: "book_general" };

  if (q.includes('i9') || q.includes('employment') || q.includes('authorized')) {
    return {
      service: "I-9 Employment Verification",
      reasoning: "We act as an Authorized Representative for remote hires.",
      estimatedPrice: "$40 Travel Reservation + $25 Service",
      action: "book_general"
    };
  }

  return { service: "Mobile Notary", reasoning: "Standard WV/OH appointment.", estimatedPrice: "$40 Reservation + State Fee", action: "book_general" };
};

// --- HELPER: GOOGLE CALENDAR LINK ---
const generateCalendarLink = (name, service, date, time, address, notes) => {
    const start = new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0,8);
    const details = `Service: ${service}\nClient: ${name}\nNotes: ${notes}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Job:+${encodeURIComponent(name)}&dates=${start}/${start}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(address)}`;
};

app.post('/api/recommend', (req, res) => res.json(recommendService(req.body.query || '')));

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready." });

  const { name, email, service, date, time, mileage } = req.body;
  
  let baseAmount = 4000; // $40.00 Base
  let productName = "Travel Reservation Fee";

  if (service.includes('I-9')) {
      baseAmount = 4000; 
      productName = "I-9 Travel Reservation Fee";
  }
  
  const miles = parseFloat(mileage) || 0;
  const extraMiles = Math.max(0, miles - 10);
  // Round to nearest cent: (extra * 2) * 100 
  const surchargeAmount = Math.round((extraMiles * 2) * 100); 

  const line_items = [
    {
      price_data: { 
          currency: 'usd', 
          product_data: { name: productName }, 
          unit_amount: baseAmount,
      },
      quantity: 1,
    }
  ];

  if (surchargeAmount > 0) {
      line_items.push({
        price_data: { 
            currency: 'usd', 
            product_data: { name: `Mileage Surcharge (${extraMiles.toFixed(2)} extra miles)` }, 
            unit_amount: surchargeAmount,
        },
        quantity: 1,
      });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      automatic_tax: { enabled: false }, 
      invoice_creation: { 
        enabled: true,
        invoice_data: {
          description: "Notary services are not subject to sales tax.",
          footer: service.includes('I-9') 
            ? "I-9 Service Fee ($25) is collected separately at appointment." 
            : "State notary fees ($5-10/stamp) are collected separately at appointment."
        }
      },
      success_url: `${CLIENT_URL}?success=true`,
      cancel_url: `${CLIENT_URL}?canceled=true`,
      customer_email: email,
      metadata: { name, service, date, time, mileage }
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { name, email, service, date, time, address, notes, mileage } = req.body;
        
        // Save to DB
        const booking = await prisma.booking.create({ data: { ...req.body, date: new Date(req.body.date) } });
        
        // SMART EMAIL LOGIC
        if (resend) {
            const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const subjectLine = `📅 BOOKING: ${dateStr} @ ${time} - ${name}`;
            const calLink = generateCalendarLink(name, service, date, time, address, notes);

            await resend.emails.send({ 
                from: SENDER_EMAIL, 
                to: ADMIN_EMAIL, 
                reply_to: email, 
                subject: subjectLine, 
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2c3e50;">New Appointment Request</h2>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                            <p><strong>Client:</strong> ${name}</p>
                            <p><strong>Service:</strong> ${service}</p>
                            <p><strong>When:</strong> ${dateStr} at ${time}</p>
                            <p><strong>Where:</strong> <a href="https://maps.google.com/?q=${encodeURIComponent(address)}">${address}</a></p>
                            <p><strong>Distance:</strong> ${mileage || 0} miles</p>
                            <p><strong>Notes:</strong> ${notes || 'None'}</p>
                        </div>
                        <br/>
                        <div style="text-align: center;">
                            <a href="${calLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">📅 Add to Google Calendar</a>
                            <br/><br/>
                            <a href="mailto:${email}" style="color: #64748b; text-decoration: none;">Reply to Client</a>
                        </div>
                    </div>
                ` 
            });
        }
        res.json(booking);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Booking failed" }); 
    }
});

app.get('/api/bookings', async (req, res) => {
    try { const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }); res.json({ data: bookings }); } 
    catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

app.post('/api/bookings/delete/:id', async (req, res) => {
  try { await prisma.booking.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: "Deleted" }); }
  catch (err) { res.json({ message: "Deleted" }); }
});

app.post('/api/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }) });
    else res.status(401).json({ error: "Invalid password" });
});

// I-9 / Notary Invoice Endpoint
app.post('/api/create-invoice', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not ready." });
  const { id, signatures, type } = req.body;
  try {
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    
    let amount = 1000;
    let desc = 'Notary Fee';
    let count = parseInt(signatures) || 1;

    if (type === 'custom') { 
         amount = 2500; 
         desc = 'Professional Service Fee (I-9 / Other)';
         count = 1;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'usd', product_data: { name: desc }, unit_amount: amount },
        quantity: count,
      }],
      mode: 'payment',
      success_url: `${CLIENT_URL}?paid=true`,
      cancel_url: `${CLIENT_URL}`,
      customer_email: booking.email,
    });
    if (resend) await resend.emails.send({ from: SENDER_EMAIL, to: booking.email, reply_to: ADMIN_EMAIL, subject: 'Invoice: Service Fees', html: `<p>Please pay your service fees here: <a href="${session.url}">Pay Now</a></p><p>Signature Seal Mobile Notary</p>` });
    res.json({ message: "Invoice sent!" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API active on ${PORT} (WV/OH Scope)`));
