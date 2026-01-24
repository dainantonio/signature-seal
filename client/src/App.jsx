// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// EMERGENCY HARD-WIRED URL
const API_URL = 'https://signature-seal.onrender.com';

const safeFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      throw new Error("Server returned a webpage instead of data. The server might be down or restarting.");
    }
    return res;
  } catch (err) {
    throw new Error(err.message === "Failed to fetch" ? "Cannot connect to server. Ensure it is LIVE on Render." : err.message);
  }
};

// ... [Keep standard App logic, but update the submitBooking function inside the App] ...
// (Providing the full file below to ensure no syntax errors)

function App() {
  const [view, setView] = useState('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const handleBookingOpen = (service = null) => { if (service) setPreSelectedService(service); setIsBookingOpen(true); };
  const handleLogin = (token) => { localStorage.setItem('adminToken', token); setAdminToken(token); };
  const handleLogout = () => { localStorage.removeItem('adminToken'); setAdminToken(null); setView('home'); };

  return (
    <div className="font-sans min-h-screen bg-white">
      <Navbar onBookClick={() => handleBookingOpen()} onViewChange={setView} currentView={view} />
      <main>
        {view === 'home' ? (
          <>
            <Hero onBookClick={() => handleBookingOpen()} />
            <Services />
            <Pricing onBookClick={(service) => handleBookingOpen(service)} />
            <AIChatWidget onRecommend={(service) => handleBookingOpen(service)} />
          </>
        ) : (!adminToken ? <LoginScreen onLogin={handleLogin} /> : <AdminDashboard token={adminToken} onLogout={handleLogout} />)}
      </main>
      <Footer onViewChange={setView} />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} initialService={preSelectedService} />
    </div>
  );
}

// COMPONENT DEFINITIONS (NAVBAR, HERO, ETC - AS PER PREVIOUS VERSION)
// [OMITTED FOR BREVITY BUT ENSURE THEY ARE IN YOUR ACTUAL FILE]
// ... Just make sure the 'BookingModal' uses the updated 'submitBooking' logic:

const BookingModal = ({ isOpen, onClose, initialService }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ service: '', date: '', time: '', name: '', email: '', address: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payNow, setPayNow] = useState(false);

  useEffect(() => { if (initialService) setFormData(prev => ({ ...prev, service: initialService })); }, [initialService]);

  const timeSlots = useMemo(() => {
    if (!formData.date) return [];
    const dateObj = new Date(formData.date + 'T12:00:00');
    const day = dateObj.getDay(); 
    if (day === 0) return []; 
    else if (day === 6) return ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    else return ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
  }, [formData.date]);

  const submitBooking = async () => {
    setIsSubmitting(true);
    const endpoint = payNow ? `${API_URL}/api/create-checkout-session` : `${API_URL}/api/bookings`;
    try {
      const res = await safeFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        if (payNow && data.url) window.location.href = data.url;
        else setSuccess(true);
      } else {
        alert(data.error || "Failed to process request.");
      }
    } catch (err) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-navy-dark/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {success ? (
          <div className="p-20 text-center">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Confirmed!</h3>
            <button onClick={onClose} className="mt-6 bg-brand-navy-dark text-white px-8 py-3 rounded-xl">Close</button>
          </div>
        ) : (
          <>
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Booking Details</h2>
              <button onClick={onClose}><X/></button>
            </div>
            <div className="p-8 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-4">
                  {['Mobile Notary', 'Loan Signing', 'Remote Online Notary (OH & WV)'].map(s => (
                    <button key={s} onClick={() => setFormData({...formData, service: s})} className={`w-full p-4 text-left border rounded-xl ${formData.service === s ? 'bg-brand-navy-dark text-white' : 'bg-white'}`}>{s}</button>
                  ))}
                  <input type="date" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, date: e.target.value})} />
                  <select className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, time: e.target.value})}>
                    <option>Select Time</option>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <input placeholder="Name" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input placeholder="Email" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <p className="bg-gray-50 p-4 rounded-xl"><b>Service:</b> {formData.service}<br/><b>When:</b> {formData.date} at {formData.time}</p>
                  <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer">
                    <input type="checkbox" checked={payNow} onChange={e => setPayNow(e.target.checked)} className="w-5 h-5" />
                    <span><b>Pay Online Now</b> (Secure via Stripe)</span>
                  </label>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={step === 1 ? 'invisible' : ''}>Back</button>
              <button onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} className="bg-brand-navy-dark text-white px-10 py-3 rounded-xl">
                {isSubmitting ? 'Processing...' : step === 3 ? 'Confirm' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// [Placeholder Components for Navbar, Hero, etc. - Replace with your actual styled components]
const Navbar = ({ onBookClick }) => <nav className="p-6 flex justify-between bg-brand-navy-dark text-white"><span>Signature Seal</span><button onClick={onBookClick} className="bg-brand-teal px-4 py-2 rounded">Book Now</button></nav>;
const Hero = ({ onBookClick }) => <div className="p-20 text-center"><h1>Professional Notary</h1><button onClick={onBookClick}>Book</button></div>;
const Services = () => <div className="p-20">Our Services</div>;
const Pricing = ({ onBookClick }) => <div className="p-20">Pricing</div>;
const AIChatWidget = () => null;
const Footer = () => <footer className="p-10 text-center border-t">© 2026 Signature Seal</footer>;
const LoginScreen = () => null;
const AdminDashboard = () => null;

export default App;
