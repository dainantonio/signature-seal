// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HARD-WIRED PRODUCTION CONFIG ---
const API_URL = 'https://signature-seal.onrender.com';

// --- HELPER: SAFE FETCH ---
const safeFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      const text = await res.text();
      console.error("API Error Response:", text);
      throw new Error("Server is restarting or configured incorrectly. Please wait 1 minute and try again.");
    }
    return res;
  } catch (err) {
    throw new Error(err.message === "Failed to fetch" ? "Server unreachable. Ensure your Render service is 'Live'." : err.message);
  }
};

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
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
            <h1 className={`font-serif text-3xl font-bold leading-none tracking-tight text-center ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-xs leading-none tracking-[0.2em] uppercase font-bold mt-1.5 text-center ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>Notary Service</span>
          </div>
        </div>
        <div className="flex items-center space-x-10">
          {currentView === 'home' && ['Services', 'Why Us', 'Pricing'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className={`font-medium text-base transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>{item}</a>
          ))}
          <button onClick={() => onBookClick()} className={`font-bold px-10 py-3.5 rounded-full transition-all duration-300 transform hover:-translate-y-0.5 ${scrolled ? 'bg-brand-teal text-white shadow-lg' : 'bg-white text-brand-navy-dark shadow-xl'}`}>Book Now</button>
        </div>
      </div>

      <div className="md:hidden container mx-auto px-6 h-24 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="w-10"></div>
        <div className="flex flex-row items-center gap-3 cursor-pointer" onClick={() => onViewChange('home')}>
           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold'}`}>
            <Award className="w-6 h-6" />
          </div>
          <div className="flex flex-col justify-center items-center">
            <h1 className={`font-serif text-xl font-bold leading-none ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-[10px] uppercase font-bold mt-1 tracking-widest ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>Notary Service</span>
          </div>
        </div>
        <div className="justify-self-end">
          <button className={`p-2 ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`} onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X size={28} /> : <Menu size={28} />}</button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden fixed top-0 left-0 w-full h-screen bg-white z-40 flex flex-col items-center justify-center space-y-8">
             {['Services', 'Why Us', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setIsOpen(false)} className="text-3xl font-serif font-bold text-brand-navy-dark">{item}</a>
            ))}
            <button onClick={() => { onBookClick(); setIsOpen(false); }} className="bg-brand-teal text-white font-bold px-10 py-4 rounded-full text-xl shadow-xl">Book Now</button>
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
    } catch (err) { setMessages(prev => [...prev, { role: 'assistant', text: "Connection error. Please book directly below." }]); } finally { setIsLoading(false); }
  };
  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl mb-6 w-[90vw] md:w-96 border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-brand-navy-dark p-4 flex items-center gap-3 text-white">
              <MessageSquare size={20} className="text-brand-gold" />
              <h3 className="font-bold text-sm">Concierge AI</h3>
              <button onClick={() => setIsOpen(false)} className="ml-auto opacity-50 hover:opacity-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-brand-teal text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'}`}>
                    <p>{msg.text}</p>
                    {msg.recommendation && (
                      <button onClick={() => { setIsOpen(false); onRecommend(msg.recommendation.service); }} className="w-full bg-brand-navy-dark text-white text-xs py-2 rounded font-bold mt-3">Book {msg.recommendation.service}</button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 rounded-lg px-4 py-2 text-sm outline-none" />
              <button type="submit" disabled={isLoading} className="p-2 bg-brand-navy-dark text-white rounded-lg"><Send size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-brand-teal text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all"><MessageSquare size={28} /></button>
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

  const submitBooking = async () => {
    setIsSubmitting(true);
    const endpoint = payNow ? `${API_URL}/api/create-checkout-session` : `${API_URL}/api/bookings`;
    try {
      const res = await safeFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (res.ok) {
        if (payNow && data.url) window.location.href = data.url;
        else setSuccess(true);
      } else { alert(data.error || "Submission failed."); }
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-navy-dark/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {success ? (
          <div className="p-20 text-center">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h3 className="text-3xl font-serif font-bold text-brand-navy-dark mb-4">Confirmed!</h3>
            <p className="text-gray-500 mb-8">We've received your booking request.</p>
            <button onClick={onClose} className="bg-brand-navy-dark text-white px-10 py-3 rounded-xl font-bold">Close</button>
          </div>
        ) : (
          <>
            <div className="px-8 py-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold font-serif text-brand-navy-dark">{step === 1 ? 'Select Service' : step === 2 ? 'Your Details' : 'Review & Pay'}</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Mobile Notary', 'Loan Signing', 'Remote Online Notary (OH & WV)', 'Estate Planning'].map(svc => (
                      <button key={svc} onClick={() => setFormData({...formData, service: svc})} className={`p-4 rounded-xl text-left border-2 font-bold transition-all ${formData.service === svc ? 'border-brand-teal bg-teal-50 text-brand-navy-dark' : 'border-gray-100 hover:border-brand-teal/30'}`}>{svc}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <input type="date" className="p-3 border-2 border-gray-100 rounded-xl w-full outline-none focus:border-brand-teal" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                    <select className="p-3 border-2 border-gray-100 rounded-xl w-full outline-none focus:border-brand-teal disabled:opacity-50" onChange={(e) => setFormData({...formData, time: e.target.value})} value={formData.time} disabled={!formData.date || timeSlots.length === 0}>
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <input type="text" placeholder="Full Name" className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-brand-teal" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-brand-teal" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <textarea placeholder="Meeting Address" rows={3} className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-brand-teal" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase font-bold mb-2 tracking-wider">Appointment Summary</p>
                    <p className="text-lg font-bold text-brand-navy-dark">{formData.service}</p>
                    <p className="text-gray-600">{new Date(formData.date).toLocaleDateString()} at {formData.time}</p>
                  </div>
                  <label className="flex items-center gap-4 p-5 border-2 border-brand-teal/20 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors">
                    <input type="checkbox" checked={payNow} onChange={e => setPayNow(e.target.checked)} className="w-6 h-6 rounded accent-brand-teal" />
                    <div className="flex-1"><span className="font-bold text-brand-navy-dark flex items-center gap-2"><CreditCard size={18}/> Pay Online Now</span><p className="text-xs text-gray-500">Secure Checkout via Stripe (Credit Card / Apple Pay)</p></div>
                  </label>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-between bg-white">
              <button onClick={() => setStep(s => s - 1)} className={`text-gray-400 font-bold px-6 py-2 ${step === 1 ? 'invisible' : ''}`}>Back</button>
              <button onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} disabled={step === 1 && (!formData.service || !formData.date || !formData.time)} className="bg-brand-navy-dark text-white px-12 py-3.5 rounded-xl font-bold shadow-lg hover:bg-brand-teal transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? (payNow ? 'Proceed to Payment' : 'Confirm Booking') : 'Continue'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE SECTIONS ---

const Hero = ({ onBookClick }) => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070" alt="Background" className="w-full h-full object-cover scale-105" />
      <div className="absolute inset-0 bg-brand-navy-dark/90 mix-blend-multiply"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark via-transparent to-transparent opacity-80"></div>
    </div>
    <div className="container mx-auto px-6 relative z-10 text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-brand-gold text-xs font-bold uppercase tracking-widest mb-10 border border-white/10">Premier Mobile Notary Service</div>
        <h1 className="text-5xl md:text-8xl font-bold text-white font-serif mb-8 leading-tight tracking-tight">Trust in Every <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-gold">Signature.</span></h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">Certified mobile notary services delivered to your doorstep. Accurate, bonded, and ready on your schedule.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button onClick={() => onBookClick()} className="bg-brand-teal text-white font-bold px-12 py-5 rounded-full hover:scale-105 transition-all shadow-2xl shadow-brand-teal/40 text-lg">Book Appointment</button>
          <a href="#services" className="border-2 border-white/20 text-white font-bold px-12 py-5 rounded-full hover:bg-white/10 transition-all text-lg backdrop-blur-sm">Explore Services</a>
        </div>
      </motion.div>
    </div>
  </section>
);

const Services = () => (
  <section id="services" className="py-32 bg-white relative">
    <div className="container mx-auto px-6">
      <div className="text-center mb-24 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-navy-dark mb-6 tracking-tight">Our Expertise</h2>
        <p className="text-xl text-gray-500">Comprehensive legal signing solutions tailored to your schedule.</p>
      </div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-10">
        {[
          { icon: Car, title: "Mobile Notary", desc: "We travel to homes, offices, or hospitals—wherever you need us." },
          { icon: FileSignature, title: "Loan Signings", desc: "Expert handling of closings, refinancing, and HELOC packages." },
          { icon: ShieldCheck, title: "Estate Planning", desc: "Wills, POAs, and affidavits handled with strict legal compliance." }
        ].map((s, i) => (
          <motion.div key={i} variants={fadeInUp} className="p-10 rounded-[2.5rem] bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-gray-100 text-center">
            <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-sm"><s.icon className="text-brand-navy-dark" size={36}/></div>
            <h3 className="text-2xl font-bold text-brand-navy-dark mb-4">{s.title}</h3>
            <p className="text-gray-500 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const Pricing = ({ onBookClick }) => (
  <section id="pricing" className="py-32 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-20"><h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-navy-dark mb-4">Transparent Pricing</h2><p className="text-xl text-gray-500">Professional service. Simple flat rates.</p></div>
      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center group hover:shadow-xl transition-all">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Local Service</span>
          <h3 className="text-3xl font-bold mb-6 text-brand-navy-dark">Mobile Notary</h3>
          <div className="text-6xl font-serif font-bold mb-10 text-brand-navy-dark group-hover:scale-110 transition-transform">From $40</div>
          <ul className="space-y-4 mb-12 text-gray-600 w-full">
            {['Travel included (10 miles)', '1 Notarial Act included', 'Evening & Weekends', 'State Fees Apply ($5 OH / $10 WV)'].map(item => (
              <li key={item} className="flex items-center gap-3 font-medium"><Check size={18} className="text-brand-teal"/> {item}</li>
            ))}
          </ul>
          <button onClick={() => onBookClick('Mobile Notary')} className="w-full py-5 rounded-2xl border-2 border-brand-navy-dark text-brand-navy-dark font-bold hover:bg-brand-navy-dark hover:text-white transition-all text-lg">Choose Standard</button>
        </div>
        <div className="bg-brand-navy-dark p-12 rounded-[3rem] shadow-2xl flex flex-col items-center text-white relative overflow-hidden transform md:-translate-y-4">
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-brand-teal to-brand-gold"></div>
          <span className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-4">All-Inclusive</span>
          <h3 className="text-3xl font-bold mb-6">Loan Signing</h3>
          <div className="text-6xl font-serif font-bold mb-10">$150</div>
          <ul className="space-y-4 mb-12 text-gray-300 w-full">
            {['Full loan package handling', 'Travel up to 20 miles', 'Printing & Scan-backs', 'Courier/FedEx Drop-off'].map(item => (
              <li key={item} className="flex items-center gap-3 font-medium"><Check size={18} className="text-brand-teal"/> {item}</li>
            ))}
          </ul>
          <button onClick={() => onBookClick('Loan Signing')} className="w-full py-5 rounded-2xl bg-brand-teal text-white font-bold hover:bg-teal-500 transition-all text-lg shadow-lg shadow-brand-teal/30">Choose Premium</button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = ({ onViewChange }) => (
  <footer className="bg-white border-t border-gray-100 py-20 text-center">
    <div className="inline-block p-4 bg-gray-50 rounded-2xl mb-8"><Award className="text-brand-gold" size={40}/></div>
    <h2 className="font-serif text-3xl font-bold text-brand-navy-dark mb-10">Signature Seal Notary</h2>
    <div className="flex justify-center gap-10 mb-12 text-gray-500 font-bold uppercase text-xs tracking-widest">
      <a href="#services" className="hover:text-brand-teal">Services</a>
      <a href="#pricing" className="hover:text-brand-teal">Pricing</a>
      <a href="#why-us" className="hover:text-brand-teal">About</a>
    </div>
    <p className="text-gray-400 text-sm font-medium">© {new Date().getFullYear()} Signature Seal Notaries. All rights reserved.</p>
    <button onClick={() => onViewChange('admin')} className="mt-10 text-xs text-gray-300 hover:text-brand-navy-dark flex items-center justify-center gap-1 mx-auto"><Lock size={12}/> Admin Portal</button>
  </footer>
);

// --- ADMIN LOGIN & DASHBOARD ---

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
      if (res.ok) onLogin(data.token); else setError("Incorrect password.");
    } catch (err) { setError("Could not connect to server."); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-brand-navy-dark flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
        <Lock size={48} className="mx-auto text-brand-navy-dark mb-6" />
        <h2 className="text-2xl font-bold mb-8">Admin Access</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full p-4 border-2 rounded-xl outline-none focus:border-brand-teal" />
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-brand-navy-dark text-white font-bold py-4 rounded-xl shadow-lg">{loading ? 'Unlocking...' : 'Login'}</button>
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
      const res = await fetch(`${API_URL}/api/bookings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) await fetch(`${API_URL}/api/bookings/delete/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (err) { alert("Server error during deletion."); }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => { setBookings(Array.isArray(data) ? data : (data.data || [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <div className="container mx-auto px-6 py-32 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-serif font-bold text-brand-navy-dark tracking-tight">Active Bookings</h2>
        <button onClick={onLogout} className="bg-red-50 text-red-500 px-6 py-2 rounded-full font-bold hover:bg-red-100 flex items-center gap-2"><LogOut size={18}/> Logout</button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-teal" size={48}/></div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bookings.map(b => (
            <div key={b.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
              <button onClick={() => handleDelete(b.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500"><Trash2 size={20}/></button>
              <span className="text-xs font-bold text-brand-teal uppercase tracking-widest">{b.service}</span>
              <h3 className="text-2xl font-bold text-brand-navy-dark mt-2 mb-1">{b.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{b.email}</p>
              <div className="space-y-2 text-sm font-medium text-gray-600 pt-6 border-t border-gray-50">
                <p className="flex items-center gap-2"><Calendar size={16} className="text-brand-gold"/> {new Date(b.date).toLocaleDateString()}</p>
                <p className="flex items-center gap-2"><Clock size={16} className="text-brand-gold"/> {b.time}</p>
                <p className="flex items-center gap-2"><MapPin size={16} className="text-brand-gold"/> {b.address || 'Direct Contact'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- APP ROOT ---

function App() {
  const [view, setView] = useState('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));

  const handleBookingOpen = (service = null) => { if (service) setPreSelectedService(service); setIsBookingOpen(true); };
  const handleLogin = (token) => { localStorage.setItem('adminToken', token); setAdminToken(token); };
  const handleLogout = () => { localStorage.removeItem('adminToken'); setAdminToken(null); setView('home'); };

  useEffect(() => {
    if (window.location.search.includes('success=true')) { alert("Payment Successful! Thank you for choosing Signature Seal."); window.history.replaceState({}, document.title, "/"); }
    if (window.location.search.includes('canceled=true')) { alert("Payment Canceled."); window.history.replaceState({}, document.title, "/"); }
  }, []);

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
