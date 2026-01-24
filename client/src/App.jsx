// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG ---
const getBackendUrl = () => {
  // 1. Prioritize the Vercel Environment Variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  
  // 2. Codespaces / Gitpod Auto-Detection
  const hostname = window.location.hostname;
  if (hostname.includes('github.dev') || hostname.includes('gitpod.io')) {
    if (hostname.includes('-5173')) return `https://${hostname.replace('-5173', '-3001')}`;
  }

  // 3. Localhost Fallback
  return 'http://localhost:3001';
};

const API_URL = getBackendUrl();
console.log("🔗 Frontend connected to API:", API_URL);

// --- HELPER: SAFE FETCH ---
const safeFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    
    // Check if we got HTML instead of JSON (The "Smoking Gun" error)
    if (contentType && contentType.indexOf("application/json") === -1) {
      const text = await res.text();
      console.error(`❌ API Error: Expected JSON, got HTML from ${url}`);
      throw new Error(`Connection Error: The website tried to talk to the server at ${url}, but got a webpage instead. Please check VITE_API_URL in Vercel settings.`);
    }
    
    return res;
  } catch (err) {
    console.error("Network Request Failed:", err);
    throw err;
  }
};

// --- COMPONENTS ---

const Navbar = ({ onBookClick, onViewChange, currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-white/95 backdrop-blur-xl border-gray-100 py-2' : 'bg-transparent border-transparent py-5'}`}>
      <div className="hidden md:flex container mx-auto px-6 justify-between items-center h-24"> 
        <div className="flex items-center gap-4 cursor-pointer group select-none" onClick={() => onViewChange('home')}>
          <div className={`w-14 h-14 rounded-2xl transition-all duration-300 shrink-0 flex items-center justify-center shadow-md ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold backdrop-blur-md'}`}>
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col justify-center items-center"> 
            <h1 className={`font-serif text-3xl font-bold leading-none tracking-tight whitespace-nowrap text-center ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>
              Signature Seal
            </h1>
            <span className={`text-xs leading-none tracking-[0.2em] uppercase font-bold mt-1.5 whitespace-nowrap text-center ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>
              Notary Service
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-10">
          {currentView === 'home' && ['Services', 'Why Us', 'Pricing'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className={`font-medium text-base tracking-wide transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>{item}</a>
          ))}
          <button onClick={() => onBookClick()} className={`font-bold px-10 py-3.5 rounded-full transition-all duration-300 transform hover:-translate-y-0.5 text-base ${scrolled ? 'bg-brand-teal text-white shadow-lg' : 'bg-white text-brand-navy-dark shadow-xl'}`}>Book Now</button>
        </div>
      </div>
      <div className="md:hidden container mx-auto px-6 h-24 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="justify-self-start w-10"></div>
        <div className="justify-self-center flex flex-row items-center gap-3 cursor-pointer w-full justify-center" onClick={() => onViewChange('home')}>
           <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold backdrop-blur-md'}`}>
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col justify-center items-center">
            <h1 className={`font-serif text-xl sm:text-2xl font-bold leading-none whitespace-nowrap text-center ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>
              Signature Seal
            </h1>
            <span className={`text-[10px] sm:text-xs leading-none uppercase font-bold mt-1 whitespace-nowrap text-center tracking-widest ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>
              Notary Service
            </span>
          </div>
        </div>
        <div className="justify-self-end">
          <button className={`p-2 ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`} onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}</button>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden fixed top-0 left-0 w-full h-screen bg-white z-40 flex flex-col items-center justify-center space-y-8">
             {['Services', 'Why Us', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setIsOpen(false)} className="text-3xl font-serif font-bold text-brand-navy-dark hover:text-brand-teal">{item}</a>
            ))}
            <button onClick={() => { onBookClick(); setIsOpen(false); }} className="bg-brand-teal text-white font-bold px-10 py-4 rounded-full text-xl shadow-xl mt-8">Book Appointment</button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// AI Widget
const AIChatWidget = ({ onRecommend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hello! I'm your scheduling assistant. What service are you looking for today?" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await safeFetch(`${API_URL}/api/recommend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: userMsg }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reasoning, recommendation: data }]);
    } catch (err) { 
        setMessages(prev => [...prev, { role: 'assistant', text: "Connection error. Please try again later." }]); 
    } finally { setIsLoading(false); }
  };
  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl mb-6 w-[90vw] md:w-96 border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-brand-navy-dark p-4 flex items-center gap-3 text-white shadow-md z-10">
              <h3 className="font-bold text-sm">Concierge AI</h3>
              <button onClick={() => setIsOpen(false)} className="ml-auto hover:bg-white/10 p-1 rounded transition"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-brand-teal text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'}`}>
                    <p>{msg.text}</p>
                    {msg.recommendation && (
                      <button onClick={() => { setIsOpen(false); onRecommend(msg.recommendation.service); }} className="w-full bg-white text-brand-teal text-xs py-2 rounded font-bold hover:bg-gray-100 transition shadow-sm mt-2">
                        Book Now ({msg.recommendation.estimatedPrice})
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
              <button type="submit" disabled={isLoading || !input.trim()} className="p-2 bg-brand-navy-dark text-white rounded-lg hover:bg-brand-teal transition-colors"><Send size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-brand-teal hover:bg-brand-navy-dark text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group ring-4 ring-white border border-brand-teal/20"><MessageSquare className="w-7 h-7" /></button>
    </div>
  );
};

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

  if (!isOpen) return null;

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
        if (payNow && data.url) {
          window.location.href = data.url;
        } else {
          setSuccess(true);
          setTimeout(() => { onClose(); setSuccess(false); setStep(1); setFormData({ service: '', date: '', time: '', name: '', email: '', address: '', notes: '' }); }, 2000);
        }
      } else {
        alert(`Request failed: ${data.error || "Unknown Server Error"}`);
      }
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-navy-dark/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <Check className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-3xl font-serif font-bold text-brand-navy-dark mb-4">Confirmed.</h3>
            <p className="text-gray-500">We've secured your appointment.</p>
          </div>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-50">
              <h2 className="text-xl font-bold text-brand-navy-dark font-serif">{step === 1 ? 'Select Service' : step === 2 ? 'Your Details' : 'Review & Pay'}</h2>
              <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-50 cursor-pointer"><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto bg-gray-50/30">
              {step === 1 && (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    {['Mobile Notary', 'Loan Signing', 'Estate Planning', 'Vehicle Title', 'Remote Online Notary (OH & WV)'].map(svc => (
                      <button key={svc} onClick={() => setFormData({...formData, service: svc})} className={`p-5 rounded-2xl text-left border ${formData.service === svc ? 'bg-brand-navy-dark text-white' : 'bg-white'}`}>
                        <span className="font-bold">{svc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <input type="date" className="w-full p-3 border rounded-xl" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                        {formData.date && new Date(formData.date + 'T12:00:00').getDay() === 0 && <p className="text-red-500 text-xs font-bold">Closed on Sundays.</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                        <select className="w-full p-3 border rounded-xl" onChange={(e) => setFormData({...formData, time: e.target.value})} value={formData.time} disabled={!formData.date || timeSlots.length === 0}>
                        <option value="">Select</option>
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-5">
                  <input type="text" placeholder="Full Name" className="w-full p-4 border rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" className="w-full p-4 border rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <textarea placeholder="Meeting Address & Instructions" rows={3} className="w-full p-4 border rounded-xl" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  <textarea placeholder="Additional Notes (Optional)" rows={2} className="w-full p-4 border rounded-xl" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              )}
              {step === 3 && (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg space-y-6">
                  <div className="space-y-2">
                    <p><strong>Service:</strong> {formData.service}</p>
                    <p><strong>When:</strong> {formData.date} at {formData.time}</p>
                    <p><strong>Where:</strong> {formData.address}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} className="w-5 h-5 text-brand-teal rounded focus:ring-brand-teal"/>
                      <div className="flex-1"><span className="font-bold text-brand-navy-dark flex items-center gap-2"><CreditCard size={18}/> Pay Online Now</span><p className="text-xs text-gray-500">Securely pay via Stripe (Credit Card / Apple Pay)</p></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between bg-white">
              <div className="flex gap-2">
                <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`text-gray-400 font-bold px-6 ${step === 1 ? 'invisible' : ''}`}>Back</button>
                <button onClick={onClose} className="text-red-400 font-bold px-4 text-sm md:hidden">Cancel</button>
              </div>
              <button onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} disabled={step === 1 && (!formData.service || !formData.date || !formData.time)} className="bg-brand-navy-dark text-white px-10 py-4 rounded-xl font-bold shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? (payNow ? 'Proceed to Payment' : 'Confirm & Pay Later') : 'Continue'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// --- ADMIN COMPONENTS ---

const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await safeFetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (res.ok) onLogin(data.token);
      else setError("Login failed");
    } catch (err) { setError("Error connecting"); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-brand-navy-dark flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-brand-navy-dark mb-4">Admin Access</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 border rounded-xl" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-brand-navy-dark text-white font-bold py-4 rounded-xl">{loading ? <Loader2 className="animate-spin mx-auto"/> : "Unlock"}</button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ token, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete booking?")) return;
    const originalBookings = [...bookings];
    setBookings(prev => prev.filter(b => b.id !== id));
    try {
      let res = await fetch(`${API_URL}/api/bookings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) res = await fetch(`${API_URL}/api/bookings/delete/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok && (res.status === 401 || res.status === 403)) { alert("Session expired."); onLogout(); }
    } catch (err) { console.error(err); setBookings(originalBookings); alert("Delete failed"); }
  };

  const handleExport = () => {
    if (!bookings.length) return alert("No bookings");
    const headers = ["ID", "Name", "Email", "Service", "Date", "Time", "Address", "Notes"];
    const safe = (t) => `"${(t || '').toString().replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...bookings.map(b => [b.id, safe(b.name), safe(b.email), safe(b.service), safe(b.date), safe(b.time), safe(b.address), safe(b.notes)].join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${pagination.page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchBookings = (page = 1) => {
    setLoading(true);
    safeFetch(`${API_URL}/api/bookings?page=${page}&limit=9`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.data) { setBookings(data.data); setPagination(data.pagination); }
        else if (Array.isArray(data)) setBookings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(1); }, [token]);

  return (
    <div className="container mx-auto px-6 py-24 min-h-screen bg-gray-50 pt-32">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-brand-navy-dark">Admin Portal</h2>
        <div className="flex gap-4">
          <button onClick={handleExport} className="flex items-center gap-2 bg-brand-navy-dark text-white px-4 py-2 rounded-lg text-sm"><Download size={16}/> Export Page</button>
          <button onClick={onLogout} className="text-red-500"><LogOut size={24}/></button>
        </div>
      </div>
      {loading ? <Loader2 className="animate-spin mx-auto w-10 h-10" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
              <button onClick={() => handleDelete(booking.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 cursor-pointer"><Trash2 size={18} /></button>
              <div className="flex justify-between items-start mb-4"><span className="text-xs font-bold text-brand-teal uppercase">{booking.service}</span><span className="text-xs text-gray-300">#{booking.id}</span></div>
              <h3 className="font-bold text-lg">{booking.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{booking.email}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📅 {new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                <p>📍 {booking.address || "No Address"}</p>
                <p className="italic text-xs mt-2">"{booking.notes || "No Notes"}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center items-center gap-6 pb-20">
          <button onClick={() => fetchBookings(pagination.page - 1)} disabled={pagination.page === 1} className="p-3 rounded-full bg-white shadow-sm disabled:opacity-50"><ChevronLeft size={20} /></button>
          <span className="text-sm font-bold text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => fetchBookings(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-3 rounded-full bg-white shadow-sm disabled:opacity-50"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

// Main App
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
            <WhyUs />
            <Pricing onBookClick={(service) => handleBookingOpen(service)} />
            <AIChatWidget onRecommend={(service) => handleBookingOpen(service)} />
          </>
        ) : (
          !adminToken ? <LoginScreen onLogin={handleLogin} /> : <AdminDashboard token={adminToken} onLogout={handleLogout} />
        )}
      </main>
      <Footer onViewChange={setView} />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} initialService={preSelectedService} />
    </div>
  );
}

export default App;
