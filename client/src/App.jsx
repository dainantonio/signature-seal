// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG ---
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  if (hostname.includes('github.dev') || hostname.includes('gitpod.io')) {
    if (hostname.includes('-5173')) return `https://${hostname.replace('-5173', '-3001')}`;
  }
  return 'http://localhost:3001';
};

const API_URL = getBackendUrl();

// --- COMPONENTS ---

// Navbar Component
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
      
      {/* Desktop View */}
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
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className={`font-medium text-base tracking-wide transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>
              {item}
            </a>
          ))}
          <button onClick={() => onBookClick()} className={`font-bold px-10 py-3.5 rounded-full transition-all duration-300 transform hover:-translate-y-0.5 text-base ${scrolled ? 'bg-brand-teal text-white shadow-lg' : 'bg-white text-brand-navy-dark shadow-xl'}`}>
            Book Now
          </button>
        </div>
      </div>

      {/* Mobile View */}
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
          <button className={`p-2 ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-0 left-0 w-full h-screen bg-white z-40 flex flex-col items-center justify-center space-y-8"
          >
             {['Services', 'Why Us', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setIsOpen(false)} className="text-3xl font-serif font-bold text-brand-navy-dark hover:text-brand-teal">
                {item}
              </a>
            ))}
            <button onClick={() => { onBookClick(); setIsOpen(false); }} className="bg-brand-teal text-white font-bold px-10 py-4 rounded-full text-xl shadow-xl mt-8">
              Book Appointment
            </button>
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
      const res = await fetch(`${API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reasoning, recommendation: data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
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

// Booking Modal
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
        alert("Booking failed.");
      }
    } catch (err) { alert("Network Error"); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-navy-dark/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <Check className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-3xl font-serif font-bold text-brand-navy-dark mb-4">Confirmed.</h3>
            <p className="text-gray-500">We've secured your appointment.</p>
          </div>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-brand-navy-dark font-serif">{step === 1 ? 'Select Service' : step === 2 ? 'Your Details' : 'Review'}</h2>
              <button onClick={onClose}><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto bg-gray-50/30">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {['Mobile Notary', 'Loan Signing', 'Estate Planning', 'Vehicle Title'].map(svc => (
                      <button key={svc} onClick={() => setFormData({...formData, service: svc})} className={`p-5 rounded-2xl text-left border ${formData.service === svc ? 'bg-brand-navy-dark text-white' : 'bg-white'}`}>
                        <span className="font-bold">{svc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <input type="date" className="w-full p-3 border rounded-xl" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                    <select className="w-full p-3 border rounded-xl" onChange={(e) => setFormData({...formData, time: e.target.value})} value={formData.time}>
                      <option value="">Select</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
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
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-4">
                  <p><strong>Service:</strong> {formData.service}</p>
                  <p><strong>When:</strong> {formData.date} at {formData.time}</p>
                  <p><strong>Where:</strong> {formData.address}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between bg-white">
              <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`${step === 1 ? 'invisible' : ''}`}>Back</button>
              <button onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} className="bg-brand-navy-dark text-white px-10 py-4 rounded-xl font-bold">
                {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? 'Confirm' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// Admin Dashboard with Delete
const AdminDashboard = ({ token, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== id));
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => onLogout());
  }, [token]);

  return (
    <div className="container mx-auto px-6 py-24 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-serif font-bold text-brand-navy-dark">Admin Portal</h2>
        <button onClick={onLogout}><LogOut size={20} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white p-8 rounded-3xl shadow-sm relative group">
            <button onClick={() => handleDelete(booking.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
            <h3 className="text-xl font-bold">{booking.name}</h3>
            <p className="text-gray-500">{booking.service}</p>
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              <p>{new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
              <p>{booking.address}</p>
              {booking.notes && <p className="italic mt-2">"{booking.notes}"</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Login Screen
const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) onLogin(data.token);
      else alert("Invalid password");
    } catch (err) { alert("Server error"); }
  };

  return (
    <div className="min-h-screen bg-brand-navy-dark flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl text-center space-y-4">
        <h2 className="text-2xl font-bold text-brand-navy-dark">Admin Access</h2>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 border rounded-xl" />
        <button type="submit" className="w-full bg-brand-navy-dark text-white font-bold py-4 rounded-xl">Unlock</button>
      </form>
    </div>
  );
};

// Page Sections (Hero, Services, etc.) omitted for brevity but remain unchanged from previous versions

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
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" alt="Background" className="w-full h-full object-cover scale-105" />
                  <div className="absolute inset-0 bg-brand-navy-dark/90 mix-blend-multiply"></div>
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center text-white">
                    <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6">Trust in Every <br/><span className="text-brand-teal">Signature.</span></h1>
                    <p className="text-xl mb-10 text-gray-300">Professional mobile notary services.</p>
                    <button onClick={() => handleBookingOpen()} className="bg-brand-teal text-white font-bold px-10 py-4 rounded-full shadow-lg">Book Appointment</button>
                </div>
            </div>
            <AIChatWidget onRecommend={(service) => handleBookingOpen(service)} />
          </>
        ) : (
          !adminToken ? <LoginScreen onLogin={handleLogin} /> : <AdminDashboard token={adminToken} onLogout={handleLogout} />
        )}
      </main>
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} initialService={preSelectedService} />
    </div>
  );
}

export default App;
