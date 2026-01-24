// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- EMERGENCY HARD-WIRED CONFIG ---
// We have removed all environment variable checks to prevent Vercel from 
// pointing the app to the wrong address.
const API_URL = 'https://signature-seal.onrender.com';

console.log("🚀 EMERGENCY MODE: Hard-wired to Render at:", API_URL);

// --- HELPER: SAFE FETCH ---
const safeFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    
    // If the server returns a webpage (HTML) instead of data (JSON), it means we hit a 404 or redirect
    if (contentType && contentType.indexOf("application/json") === -1) {
      const text = await res.text();
      console.error(`❌ API Error: Got HTML instead of JSON from ${url}`);
      throw new Error(`The server at ${url} is not responding correctly. It sent back a webpage instead of data.`);
    }
    
    return res;
  } catch (err) {
    console.error("Fetch Request Failed:", err);
    throw new Error("Cannot reach the server. Please check if your Render service is 'Live' in the Render Dashboard.");
  }
};

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
    } catch (err) { setMessages(prev => [...prev, { role: 'assistant', text: "I can't connect to the server right now. Please try booking directly." }]); } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl mb-6 w-[90vw] md:w-96 border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-brand-navy-dark p-4 flex items-center gap-3 text-white shadow-md z-10">
              <div className="bg-white/10 p-1.5 rounded-full"><MessageSquare className="w-5 h-5 text-brand-gold" /></div>
              <h3 className="font-bold text-sm">Concierge AI</h3>
              <button onClick={() => setIsOpen(false)} className="ml-auto hover:bg-white/10 p-1 rounded transition"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-brand-teal text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'}`}>
                    <p>{msg.text}</p>
                    {msg.recommendation && (
                      <button onClick={() => { setIsOpen(false); onRecommend(msg.recommendation.service); }} className="w-full bg-white text-brand-teal text-xs py-2 rounded font-bold hover:bg-gray-100 transition shadow-sm mt-3">
                        Book {msg.recommendation.service}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 rounded-lg px-4 py-2 text-sm outline-none" />
              <button type="submit" disabled={isLoading || !input.trim()} className="p-2 bg-brand-navy-dark text-white rounded-lg"><Send size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-brand-teal text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all"><MessageSquare className="w-7 h-7" /></button>
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
        alert(`Error: ${data.error || "Submission failed"}`);
      }
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-navy-dark/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6"><Check className="w-10 h-10 text-green-500" /></div>
            <h3 className="text-3xl font-serif font-bold text-brand-navy-dark mb-4">Confirmed.</h3>
            <p className="text-gray-500">We have received your appointment details.</p>
          </div>
        ) : (
          <>
            <div className="px-8 py-6 border-b flex justify-between items-center bg-white sticky top-0 z-50">
              <h2 className="text-xl font-bold text-brand-navy-dark font-serif">{step === 1 ? 'Service' : step === 2 ? 'Details' : 'Confirm'}</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Mobile Notary', 'Loan Signing', 'Estate Planning', 'Vehicle Title', 'Remote Online Notary (OH & WV)'].map(svc => (
                      <button key={svc} onClick={() => setFormData({...formData, service: svc})} className={`p-4 rounded-xl text-left border font-bold transition-all ${formData.service === svc ? 'bg-brand-navy-dark text-white' : 'bg-white hover:border-brand-teal'}`}>{svc}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="p-3 border rounded-xl w-full" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                    <select className="p-3 border rounded-xl w-full" onChange={(e) => setFormData({...formData, time: e.target.value})} value={formData.time} disabled={!formData.date || timeSlots.length === 0}>
                      <option value="">Time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <input type="text" placeholder="Name" className="w-full p-4 border rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="email" placeholder="Email" className="w-full p-4 border rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <textarea placeholder="Meeting Address" rows={3} className="w-full p-4 border rounded-xl" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  <textarea placeholder="Notes (Optional)" rows={2} className="w-full p-4 border rounded-xl" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p><strong>Service:</strong> {formData.service}</p>
                    <p><strong>Date:</strong> {formData.date} at {formData.time}</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-5 border rounded-2xl hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} className="w-5 h-5 text-brand-teal rounded"/>
                    <div className="flex-1"><span className="font-bold text-brand-navy-dark flex items-center gap-2"><CreditCard size={18}/> Pay Online Now</span><p className="text-xs text-gray-500">Securely pay via Stripe</p></div>
                  </label>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-between bg-white">
              <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`text-gray-400 font-bold px-6 ${step === 1 ? 'invisible' : ''}`}>Back</button>
              <button onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} disabled={step === 1 && (!formData.service || !formData.date || !formData.time)} className="bg-brand-navy-dark text-white px-10 py-4 rounded-xl font-bold shadow-lg disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? (payNow ? 'Proceed to Payment' : 'Confirm') : 'Continue'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// Admin Section
const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await safeFetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (res.ok) onLogin(data.token); else setError("Login failed");
    } catch (err) { setError("Error connecting to server"); }
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

const AdminDashboard = ({ token, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete booking?")) return;
    setBookings(prev => prev.filter(b => b.id !== id));
    try {
      let res = await fetch(`${API_URL}/api/bookings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) await fetch(`${API_URL}/api/bookings/delete/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (err) { alert("Delete failed"); }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setBookings(data.data || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <div className="container mx-auto px-6 py-32 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Admin Portal</h2>
        <button onClick={onLogout} className="text-red-500"><LogOut/></button>
      </div>
      {loading ? <Loader2 className="animate-spin mx-auto"/> : (
        <div className="grid md:grid-cols-3 gap-6">
          {bookings.map(b => (
            <div key={b.id} className="bg-white p-6 rounded-2xl shadow-sm border relative">
              <button onClick={() => handleDelete(b.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
              <span className="text-xs font-bold text-brand-teal uppercase">{b.service}</span>
              <h3 className="font-bold text-lg mt-2">{b.name}</h3>
              <p className="text-sm text-gray-500">{b.email}</p>
              <div className="text-sm text-gray-600 mt-4"><p>📅 {new Date(b.date).toLocaleDateString()} - {b.time}</p><p>📍 {b.address}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Page Sections
const Hero = ({ onBookClick }) => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070" alt="Background" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-brand-navy-dark/90"></div>
    </div>
    <div className="container mx-auto px-6 relative z-10 text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-bold uppercase tracking-widest mb-8">Premier Notary Service</div>
        <h1 className="text-5xl md:text-8xl font-bold text-white font-serif mb-8 leading-tight">Trust in Every <br/><span className="text-brand-teal">Signature.</span></h1>
        <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">Professional, certified mobile notary services delivered to your doorstep. Accuracy you can rely on.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => onBookClick()} className="bg-brand-teal text-white font-bold px-10 py-5 rounded-full hover:scale-105 transition-all shadow-xl shadow-brand-teal/20">Book Appointment</button>
          <a href="#services" className="border border-white/20 text-white font-bold px-10 py-5 rounded-full hover:bg-white/10 transition-all">Our Services</a>
        </div>
      </motion.div>
    </div>
  </section>
);

const Services = () => (
  <section id="services" className="py-32 bg-white">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-4xl font-serif font-bold text-brand-navy-dark mb-16">Our Expertise</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: Car, title: "Mobile Notary", desc: "We travel to you—homes, offices, or hospitals—for seamless notarization." },
          { icon: FileSignature, title: "Loan Signings", desc: "Expert handling of closings, refinancing, and HELOCs." },
          { icon: ShieldCheck, title: "Legal Docs", desc: "Wills, POAs, and affidavits handled with strict compliance." }
        ].map((s, i) => (
          <div key={i} className="p-10 rounded-3xl bg-gray-50 text-center hover:bg-white hover:shadow-2xl transition-all">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm"><s.icon className="text-brand-navy-dark" size={32}/></div>
            <h3 className="text-2xl font-bold text-brand-navy-dark mb-4">{s.title}</h3>
            <p className="text-gray-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing = ({ onBookClick }) => (
  <section id="pricing" className="py-32 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16"><h2 className="text-4xl font-serif font-bold text-brand-navy-dark">Transparent Pricing</h2><p className="text-gray-500 mt-4">Simple flat rates. No hidden fees.</p></div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Standard</span>
          <h3 className="text-2xl font-bold mb-6">Mobile Notary</h3>
          <div className="text-5xl font-serif font-bold mb-8">From $40</div>
          <ul className="space-y-3 mb-10 text-gray-600 text-sm"><li className="flex items-center gap-2"><Check size={16} className="text-brand-teal"/> Travel up to 10 miles</li><li className="flex items-center gap-2"><Check size={16} className="text-brand-teal"/> 1 Notarial Act included</li><li className="flex items-center gap-2"><Check size={16} className="text-brand-teal"/> Evening & Weekend availability</li></ul>
          <button onClick={() => onBookClick('Mobile Notary')} className="w-full py-4 rounded-xl border-2 border-brand-navy-dark font-bold hover:bg-brand-navy-dark hover:text-white transition-all">Select</button>
        </div>
        <div className="bg-brand-navy-dark p-10 rounded-3xl shadow-2xl flex flex-col items-center text-white relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-brand-teal"></div>
          <span className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-4">All-Inclusive</span>
          <h3 className="text-2xl font-bold mb-6">Loan Signing</h3>
          <div className="text-5xl font-serif font-bold mb-8">$150</div>
          <ul className="space-y-3 mb-10 text-gray-300 text-sm"><li className="flex items-center gap-2"><Check size={16} className="text-brand-teal"/> Full loan package handling</li><li className="flex items-center gap-2"><Check size={16} className="text-brand-teal"/> Travel included (up to 20 miles)</li><li className="flex items-center gap-2"><Check size={16} className="text-brand-teal"/> Courier/Scan-backs included</li></ul>
          <button onClick={() => onBookClick('Loan Signing')} className="w-full py-4 rounded-xl bg-brand-teal font-bold hover:bg-teal-500 transition-all">Select</button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = ({ onViewChange }) => (
  <footer className="bg-white border-t py-16 text-center">
    <Award className="mx-auto text-brand-gold mb-4" size={40}/>
    <p className="font-bold text-brand-navy-dark">&copy; {new Date().getFullYear()} Signature Seal Notary. All rights reserved.</p>
    <div className="flex justify-center gap-6 mt-8 text-sm text-gray-500"><a href="#services">Services</a><a href="#why-us">About</a><a href="#pricing">Pricing</a></div>
    <button onClick={() => onViewChange('admin')} className="mt-8 text-xs text-gray-300 hover:text-brand-navy-dark"><Lock size={12} className="inline mr-1"/> Admin</button>
  </footer>
);

// App Root
function App() {
  const [view, setView] = useState('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const handleBookingOpen = (service = null) => { if (service) setPreSelectedService(service); setIsBookingOpen(true); };
  const handleLogin = (token) => { localStorage.setItem('adminToken', token); setAdminToken(token); };
  const handleLogout = () => { localStorage.removeItem('adminToken'); setAdminToken(null); setView('home'); };

  return (
    <div className="font-sans bg-white min-h-screen">
      <Navbar onBookClick={() => handleBookingOpen()} onViewChange={setView} currentView={view} />
      <main>
        {view === 'home' ? (
          <>
            <Hero onBookClick={() => handleBookingOpen()} />
            <Services />
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
