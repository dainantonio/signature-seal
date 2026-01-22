// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- BULLETPROOF CONFIG ---
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  if (hostname.includes('github.dev') || hostname.includes('gitpod.io')) {
    if (hostname.includes('-5173')) return `https://${hostname.replace('-5173', '-3001')}`;
  }
  return 'http://localhost:3001';
};
const API_URL = getBackendUrl();

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
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
    <nav className={`fixed w-full top-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-white/95 backdrop-blur-xl border-gray-100 py-2' : 'bg-transparent border-transparent py-6'}`}>
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
        <div className="justify-self-center flex flex-col items-center justify-center cursor-pointer w-full" onClick={() => onViewChange('home')}>
           <div className={`w-14 h-14 rounded-2xl mb-1.5 flex items-center justify-center shadow-sm ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold backdrop-blur-md'}`}>
            <Award className="w-8 h-8" />
          </div>
          <h1 className={`font-serif text-2xl font-bold leading-none whitespace-nowrap text-center ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>
            Signature Seal
          </h1>
          <span className={`text-xs leading-none uppercase font-bold mt-1 whitespace-nowrap text-center tracking-widest ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>
            Notary Service
          </span>
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
      const res = await fetch(`${API_URL}/api/recommend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: userMsg }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reasoning, recommendation: data }]);
    } catch (err) { setMessages(prev => [...prev, { role: 'assistant', text: "Connection error." }]); } finally { setIsLoading(false); }
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
    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { onClose(); setSuccess(false); setStep(1); setFormData({ service: '', date: '', time: '', name: '', email: '', address: '', notes: '' }); }, 2000);
      } else {
        alert("Booking failed (Server Error)");
      }
    } catch (err) { alert("Booking failed (Network Error)"); } finally { setIsSubmitting(false); }
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
              <h2 className="text-xl font-bold text-brand-navy-dark font-serif">{step === 1 ? 'Select Service' : step === 2 ? 'Your Details' : 'Review'}</h2>
              <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-50 cursor-pointer"><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto bg-gray-50/30">
              {step === 1 && (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    {['Mobile Notary', 'Loan Signing', 'Estate Planning', 'Vehicle Title', 'Remote Online Notary (OH Only)'].map(svc => (
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
                  <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                    <Clock className="w-5 h-5 text-brand-teal mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-brand-navy-dark">Business Hours</h4>
                      <p className="text-xs text-gray-600 mt-1">Mon-Fri: 6pm - 9pm <br/> Sat: 10am - 4pm <br/> Sun: Closed</p>
                      <p className="text-xs text-brand-teal font-bold mt-2">Appointments available outside listed hours by request.</p>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-5">
                  <input type="text" placeholder="Full Name" className="w-full p-4 border rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" className="w-full p-4 border rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <textarea placeholder="Address" rows={3} className="w-full p-4 border rounded-xl" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  <textarea placeholder="Notes" rows={2} className="w-full p-4 border rounded-xl" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              )}
              {step === 3 && (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg space-y-6">
                  <p><strong>Service:</strong> {formData.service}</p>
                  <p><strong>When:</strong> {formData.date} at {formData.time}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between bg-white">
              <div className="flex gap-2">
                <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`text-gray-400 font-bold px-6 ${step === 1 ? 'invisible' : ''}`}>Back</button>
                <button onClick={onClose} className="text-red-400 font-bold px-4 text-sm md:hidden">Cancel</button>
              </div>
              <button onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} disabled={step === 1 && (!formData.service || !formData.date || !formData.time)} className="bg-brand-navy-dark text-white px-10 py-4 rounded-xl font-bold shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? 'Confirm' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (res.ok) onLogin(data.token);
      else setError("Login failed");
    } catch (err) { setError("Error connecting"); }
  };
  return (
    <div className="min-h-screen bg-brand-navy-dark flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-brand-navy-dark mb-4">Admin Access</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 border rounded-xl" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-brand-navy-dark text-white font-bold py-4 rounded-xl">Unlock</button>
        </form>
      </div>
    </div>
  );
};

// --- UPDATED ADMIN DASHBOARD WITH CRASH PROTECTION ---
const AdminDashboard = ({ token, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchBookings = (page = 1) => {
    setLoading(true);
    fetch(`${API_URL}/api/bookings?page=${page}&limit=9`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        // Safe check: ensure data is in expected format
        if (Array.isArray(data)) {
            setBookings(data); // Legacy format support
        } else if (data && data.data && Array.isArray(data.data)) {
            setBookings(data.data); // New paginated format
            setPagination(data.pagination);
        } else {
            console.warn("Unexpected response:", data);
            setBookings([]); // prevent crash
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        // Do not auto-logout, allow user to retry
      });
  };

  useEffect(() => {
    fetchBookings(1);
  }, [token]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete booking?")) return;
    setBookings(prev => prev.filter(b => b.id !== id));
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
         await fetch(`${API_URL}/api/bookings/delete/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
         });
      }
    } catch (err) { alert("Delete failed"); }
  };

  const handleExport = () => {
    if (!bookings.length) return alert("No bookings to export.");
    const headers = ["ID", "Name", "Email", "Service", "Date", "Time", "Address", "Notes"];
    const safe = (t) => `"${(t || '').toString().replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...bookings.map(b => [b.id, safe(b.name), safe(b.email), safe(b.service), safe(b.date), safe(b.time), safe(b.address), safe(b.notes)].join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_page_${pagination.page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-6 py-24 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-brand-navy-dark">Admin Portal</h2>
        <div className="flex gap-4">
          <button onClick={handleExport} className="flex items-center gap-2 bg-brand-navy-dark text-white px-4 py-2 rounded-lg text-sm"><Download size={16}/> Export Page</button>
          <button onClick={onLogout} className="text-red-500"><LogOut size={24}/></button>
        </div>
      </div>
      
      {loading ? <Loader2 className="animate-spin mx-auto w-10 h-10" /> : (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {bookings.length === 0 ? <p>No bookings found.</p> : bookings.map(booking => (
                <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-brand-teal uppercase">{booking.service}</span>
                        <span className="text-xs text-gray-300">#{booking.id}</span>
                    </div>
                    <h3 className="font-bold text-lg">{booking.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{booking.email}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>📅 {new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                        <p>📍 {booking.address || "No Address"}</p>
                        <p className="italic text-xs mt-2">"{booking.notes || "No Notes"}"</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                        <button onClick={(e) => handleDelete(booking.id, e)} className="text-red-400 hover:text-red-600 text-sm font-bold flex items-center gap-1 cursor-pointer">
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                </div>
            ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-6 pb-20">
                <button 
                    onClick={() => fetchBookings(pagination.page - 1)} 
                    disabled={pagination.page === 1}
                    className="p-3 rounded-full bg-white shadow-sm disabled:opacity-50 hover:bg-gray-50"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                <button 
                    onClick={() => fetchBookings(pagination.page + 1)} 
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-3 rounded-full bg-white shadow-sm disabled:opacity-50 hover:bg-gray-50"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </>
      )}
    </div>
  );
};

// Page Sections (Hero, Services, WhyUs, Pricing, Footer) omitted for brevity
// REINSERTED FOR COMPLETENESS

const Hero = ({ onBookClick }) => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" alt="Background" className="w-full h-full object-cover scale-105" />
      <div className="absolute inset-0 bg-brand-navy-dark/90 mix-blend-multiply"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark via-transparent to-transparent opacity-80"></div>
    </div>

    <div className="container mx-auto px-6 relative z-10 pt-40 md:pt-20 text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-brand-gold text-xs font-bold uppercase tracking-widest mb-10">
          <Star className="w-3 h-3 fill-current" /> Premier Notary Service
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold leading-tight mb-8 font-serif text-white tracking-tight">
          Trust in Every <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal via-white to-brand-gold">Signature.</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
          Professional, certified mobile notary services delivered to your doorstep. Accuracy you can rely on, on your schedule. Appointments available outside listed hours by request.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button onClick={() => onBookClick()} className="bg-brand-teal text-white font-bold text-lg px-12 py-5 rounded-full shadow-[0_0_40px_-10px_rgba(26,188,156,0.5)] hover:bg-teal-500 hover:scale-105 transition-all duration-300">
            Book Appointment
          </button>
          <a href="#services" className="bg-transparent border border-white/20 text-white font-bold text-lg px-12 py-5 rounded-full hover:bg-white hover:text-brand-navy-dark transition-all duration-300 backdrop-blur-sm">
            Our Services
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

const Services = () => (
  <section id="services" className="py-32 bg-white relative">
    <div className="container mx-auto px-6">
      <div className="text-center mb-24 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-brand-navy-dark font-serif mb-6">Our Expertise</h2>
        <p className="text-xl text-gray-500">Comprehensive notary solutions tailored to your specific legal needs.</p>
      </div>
      
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid md:grid-cols-3 gap-10">
        {[
          { icon: Car, title: "Mobile Notary", desc: "We travel to you—homes, offices, or hospitals—for seamless notarization." },
          { icon: FileSignature, title: "Loan Signings", desc: "Expert handling of closings, refinancing, and HELOCs." },
          { icon: ShieldCheck, title: "Legal Docs", desc: "Wills, POAs, and affidavits handled with strict legal compliance." }
        ].map((s, i) => (
          <motion.div key={i} variants={fadeInUp} className="group p-10 rounded-[2rem] bg-gray-50 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 text-center border border-transparent hover:border-gray-100">
             <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-sm group-hover:bg-brand-navy-dark group-hover:scale-110 transition-all duration-500">
               <s.icon className="w-10 h-10 text-brand-navy-dark group-hover:text-brand-gold transition-colors" />
             </div>
             <h3 className="text-2xl font-bold text-brand-navy-dark mb-4">{s.title}</h3>
             <p className="text-gray-500 leading-relaxed mb-8">{s.desc}</p>
             <div className="w-12 h-1 bg-gray-200 mx-auto group-hover:bg-brand-teal group-hover:w-20 transition-all duration-500"></div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const WhyUs = () => (
  <section id="why-us" className="py-32 bg-brand-navy-dark text-white relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-teal rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold rounded-full blur-[120px]"></div>
    </div>
    <div className="container mx-auto px-6 relative z-10">
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">The Signature Standard</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-12 text-center">
        {[
          { title: "Speed", desc: "Same-day appointments often available.", icon: Clock },
          { title: "Accuracy", desc: "Zero-error guarantee on all loan packages.", icon: Check },
          { title: "Comfort", desc: "We meet you where you are most comfortable.", icon: Star }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center group">
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/5 transition-colors">
              <item.icon className="w-8 h-8 text-brand-teal" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
            <p className="text-gray-400 leading-relaxed max-w-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing = ({ onBookClick }) => (
  <section id="pricing" className="py-32 bg-gray-50">
     <div className="container mx-auto px-6">
        <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-serif text-brand-navy-dark font-bold mb-6">Transparent Pricing</h2>
            <p className="text-xl text-gray-500">Simple flat rates. No hidden fees.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Card */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col items-center text-center group">
                <span className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4">Standard</span>
                <h3 className="text-3xl font-bold text-brand-navy-dark mb-2">Mobile Notary</h3>
                <div className="text-6xl font-serif font-bold text-brand-navy-dark my-8 group-hover:scale-110 transition-transform duration-500">From $40</div>
                <ul className="space-y-4 mb-10 text-left w-full max-w-xs mx-auto">
                    {[
                      'Travel included up to 10 miles',
                      'Mileage fee applies for 10+ miles',
                      '1 Notarial Act included',
                      'State-regulated fee per stamp ($5 OH / $10 WV)',
                      'Available evenings & weekends'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-600 font-medium"><Check size={18} className="text-brand-teal shrink-0"/>{item}</li>
                    ))}
                </ul>
                <button onClick={() => onBookClick('Mobile Notary')} className="w-full py-4 rounded-xl border-2 border-brand-navy-dark text-brand-navy-dark font-bold hover:bg-brand-navy-dark hover:text-white transition-all duration-300">Choose Standard</button>
                <p className="text-xs text-gray-400 mt-4">*Base travel fee covers local service area.</p>
            </div>

            {/* Premium Card */}
            <div className="bg-brand-navy-dark p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center transform md:-translate-y-4">
                <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-brand-teal to-brand-gold"></div>
                <span className="text-sm font-bold tracking-widest text-brand-gold uppercase mb-4">All-Inclusive</span>
                <h3 className="text-3xl font-bold text-white mb-2">Loan Signing</h3>
                <div className="text-6xl font-serif font-bold text-white my-8">$150</div>
                <ul className="space-y-4 mb-10 text-left w-full max-w-xs mx-auto">
                    {['Printing (up to 150 pages)', 'Document courier service', 'After-hours availability', 'Scan-backs included', 'Travel included (up to 20 miles)'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300 font-medium"><Check size={18} className="text-brand-teal shrink-0"/>{item}</li>
                    ))}
                </ul>
                <button onClick={() => onBookClick('Loan Signing')} className="w-full py-4 rounded-xl bg-brand-teal text-white font-bold hover:bg-teal-500 shadow-lg shadow-brand-teal/25 transition-all duration-300">Choose Premium</button>
            </div>
        </div>
    </div>
  </section>
);

const Footer = ({ onViewChange }) => (
  <footer className="bg-white text-brand-navy-dark py-16 border-t border-gray-100">
    <div className="container mx-auto px-6 text-center">
      <div className="inline-block p-3 bg-gray-50 rounded-2xl mb-8">
        <Award className="w-10 h-10 text-brand-gold" />
      </div>
      <h2 className="text-2xl font-serif font-bold mb-8">Signature Seal Notary</h2>
      <div className="text-sm text-gray-400 flex flex-col items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Signature Seal Notary. All rights reserved.</p>
        <button onClick={() => onViewChange('admin')} className="text-gray-300 hover:text-brand-navy-dark transition-colors flex items-center gap-1">
          <Lock size={12} /> Admin
        </button>
      </div>
    </div>
  </footer>
);

// Main App
function App() {
  const [view, setView] = useState('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));

  const handleBookingOpen = (service = null) => {
    if (service) setPreSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setAdminToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setView('home');
  };

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
