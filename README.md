# Signature Seal — Booking + Payments Platform

Mobile-first booking and operations platform for **Signature Seal (WV & OH Notary)**:
- Client booking flow (service selection, date/time, address, notes)
- AI “Concierge” service recommendation
- Travel reservation checkout (Stripe)
- Admin ops: view bookings, delete bookings, login token
- Email notifications (Resend) + Google Calendar link generation
- SQLite + Prisma for persistence

## Live
- Website: https://signaturesealnotaries.com
- Default API target:
  - Dev: `http://localhost:3001`
  - Prod fallback: `https://signature-seal.onrender.com`

---

## Tech Stack
**Frontend**
- React + Vite
- Tailwind CSS
- Framer Motion animations

**Backend**
- Node.js + Express
- Prisma ORM + SQLite
- Stripe Checkout (reservation + mileage surcharge)
- Resend email notifications
- JWT-based admin auth (simple password gate)

---

## Monorepo Structure
