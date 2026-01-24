// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- BULLETPROOF CONFIG ---
const getBackendUrl = () => {
  let url = 'http://localhost:3001'; // Default fallback

  // 1. Production (Vercel Env Var)
  if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL;
  } 
  // 2. Codespaces / Gitpod Auto-Detection
  else {
    const hostname = window.location.hostname;
    if (hostname.includes('github.dev') || hostname.includes('gitpod.io')) {
      if (hostname.includes('-5173')) {
        url = `https://${hostname.replace('-5173', '-3001')}`;
      }
    }
  }
  
  // Clean trailing slash if present
  return url.replace(/\/$/, "");
};

const API_URL = getBackendUrl();
console.log("🔗 Connecting to Backend API at:", API_URL); // DEBUG LOG

// --- HELPER: SAFE FETCH ---
// Handles the "Unexpected token <" error by checking content-type
const safeFetch = async (url, options) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type");
  
  if (contentType && contentType.indexOf("application/json") === -1) {
    // We got HTML or Text instead of JSON
    const text = await res.text();
    console.error("❌ API Error: Received HTML instead of JSON.", text.substring(0, 200));
    throw new Error("API Configuration Error: Backend returned HTML. Check VITE_API_URL.");
  }
  
  return res;
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
    <nav className={`fixed w-full top-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-white/95 backdrop-blur-xl border-gray-100 py-2' : 'bg-transparent border-transparent py-6'}`}>
      
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:flex container mx-auto px-6 justify-between items-center h-24"> 
        <div 
          className="flex items-center gap-4 cursor-pointer group select-none" 
          onClick={() => onViewChange('home')}
        >
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
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(' ', '-')}`} 
              className={`font-medium text-base tracking-wide transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}
            >
              {item}
            </a>
          ))}
          <button 
            onClick={() => onBookClick()} 
            className={`font-bold px-10 py-3.5 rounded-full transition-all duration-300 transform hover:-translate-y-0.5 text-base ${
              scrolled 
                ? 'bg-brand-teal text-white shadow-lg hover:shadow-brand-teal/30' 
                : 'bg-white text-brand-navy-dark hover:bg-brand-gold hover:text-white shadow-xl'
            }`}
          >
            Book Now
          </button>
        </div>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden container mx-auto px-6 h-24 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="justify-self-start w-10"></div>
        <div 
          className="justify-self-center flex flex-row items-center gap-3 cursor-pointer w-full justify-center" 
          onClick={() => onViewChange('home')}
        >
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

const AIChatWidget = ({ onRecommend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your scheduling assistant. What service are you looking for today?" }
  ]);
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
      const res = await safeFetch(`${API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reasoning, recommendation: data }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting to the server. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl mb-6 w-[90vw] md:w-96 border border-gray-100 overflow-hidden flex flex-col h-[500px]"
          >
            <div className="bg-brand-navy-dark p-4 flex items-center gap-3 text-white shadow-md z-10">
              <div className="relative">
                <div className="bg-green-400 w-2.5 h-2.5 rounded-full absolute right-0 bottom-0 ring-2 ring-brand-navy-dark"></div>
                <div className="bg-white/10 p-1.5 rounded-full"><MessageSquare className="w-5 h-5 text-brand-gold" /></div>
              </div>
              <div>
                <h3 className="font-bold text-sm">Concierge AI</h3>
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Online Now</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="ml-auto hover:bg-white/10 p-1 rounded transition"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'user' ? 'bg-brand-teal text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                  }`}>
                    <p>{msg.text}</p>
                    {msg.recommendation && (
                      <div className="mt-3 pt-3 border-t border-gray-100/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white/90">{msg.recommendation.service}</span>
                        </div>
                        <button 
                          onClick={() => { setIsOpen(false); onRecommend(msg.recommendation.service); }}
                          className="w-full bg-white text-brand-teal text-xs py-2 rounded font-bold hover:bg-gray-100 transition shadow-sm"
                        >
                          Book Now ({msg.recommendation.estimatedPrice})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && <Loader2 className="w-5 h-5 animate-spin text-brand-teal mx-auto opacity-50" />}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all"
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="p-2 bg-brand-navy-dark text-white rounded-lg hover:bg-brand-teal transition-colors">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand-teal hover:bg-brand-navy-dark text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group ring-4 ring-white border border-brand-teal/20"
      >
        <MessageSquare className="w-7 h-7" />
      </button>
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

    if (day === 0) { 
      return []; 
    } else if (day === 6) { 
      return ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    } else { 
      return ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
    }
  }, [formData.date]);

  if (!isOpen) return null;

  const submitBooking = async () => {
    setIsSubmitting(true);
    
    // Determine Endpoint: Standard Booking or Payment Session?
    const endpoint = payNow ? `${API_URL}/api/create-checkout-session` : `${API_URL}/api/bookings`;

    try {
      console.log("Submitting to:", endpoint);
      const res = await safeFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (payNow && data.url) {
          // Redirect to Stripe
          window.location.href = data.url;
        } else {
          // Standard Success
          setSuccess(true);
          setTimeout(() => { onClose(); setSuccess(false); setStep(1); setFormData({ service: '', date: '', time: '', name: '', email: '', address: '', notes: '' }); }, 2000);
        }
      } else {
        alert(`Request failed: ${data.error || "Unknown Server Error"}`);
      }
    } catch (err) { 
      console.error("Network Catch:", err);
      alert(`Network Error: ${err.message}. Check console/Render logs.`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-navy-dark/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
      >
        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-serif font-bold text-brand-navy-dark mb-4">Confirmed.</h3>
            <p className="text-gray-500">We've secured your appointment. A confirmation email is on its way.</p>
          </div>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-50">
              <h2 className="text-xl font-bold text-brand-navy-dark font-serif">{step === 1 ? 'Select Service' : step === 2 ? 'Your Details' : 'Review & Pay'}</h2>
              
              {/* EXIT BUTTON */}
              <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-50 cursor-pointer">
                <X size={24}/>
              </button>
            </div>

            <div className="p-8 overflow-y-auto bg-gray-50/30">
              {step === 1 && (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* UPDATED SERVICE LIST TO INCLUDE WV RON */}
                    {['Mobile Notary', 'Loan Signing', 'Estate Planning', 'Vehicle Title', 'Remote Online Notary (OH & WV)'].map(svc => (
                      <button
                        key={svc}
                        onClick={() => setFormData({...formData, service: svc})}
                        className={`p-5 rounded-2xl text-left transition-all duration-300 relative ${
                          formData.service === svc 
                            ? 'bg-brand-navy-dark text-white shadow-xl scale-[1.02]' 
                            : 'bg-white border border-gray-100 text-gray-600 hover:border-brand-teal/30 hover:shadow-lg'
                        }`}
                      >
                        <span className="font-bold relative z-10">{svc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-gray-200 w-full" />
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                      <input type="date" className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-teal outline-none" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                      {formData.date && new Date(formData.date + 'T12:00:00').getDay() === 0 && (
                        <p className="text-red-500 text-xs font-bold">Closed on Sundays.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                      <select 
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-teal outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                        onChange={(e) => setFormData({...formData, time: e.target.value})} 
                        value={formData.time}
                        disabled={!formData.date || timeSlots.length === 0}
                      >
                        <option value="">{timeSlots.length === 0 && formData.date ? "Closed" : "Select"}</option>
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
                  <input type="text" placeholder="Full Name" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none bg-white transition-shadow focus:shadow-lg" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none bg-white transition-shadow focus:shadow-lg" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <textarea placeholder="Meeting Address & Instructions" rows={3} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none bg-white transition-shadow focus:shadow-lg" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  <textarea placeholder="Additional Notes (Optional)" rows={2} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none bg-white transition-shadow focus:shadow-lg" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
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
                      <input 
                        type="checkbox" 
                        checked={payNow} 
                        onChange={(e) => setPayNow(e.target.checked)}
                        className="w-5 h-5 text-brand-teal rounded focus:ring-brand-teal"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-brand-navy-dark flex items-center gap-2"><CreditCard size={18}/> Pay Online Now</span>
                        <p className="text-xs text-gray-500">Securely pay via Stripe (Credit Card / Apple Pay)</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between bg-white">
              <div className="flex gap-2 w-full md:w-auto">
                {/* CANCEL BUTTON */}
                <button onClick={onClose} className="text-red-400 font-bold hover:text-red-600 px-4 text-sm whitespace-nowrap">Cancel</button>
                <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`text-gray-400 font-bold hover:text-brand-navy px-6 ${step === 1 ? 'invisible' : ''}`}>Back</button>
              </div>
              <button 
                onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} 
                disabled={step === 1 && (!formData.service || !formData.date || !formData.time)}
                className="bg-brand-navy-dark text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:shadow-brand-teal/40 hover:bg-brand-teal transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? (payNow ? 'Proceed to Payment' : 'Confirm & Pay Later') : 'Continue'} <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// --- AUTH & ADMIN COMPONENTS ---

const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await safeFetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data.token);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(`Cannot connect to: ${API_URL}. Ensure server is running.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy-dark flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center">
        <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-brand-navy-dark" />
        </div>
        <h2 className="text-2xl font-bold text-brand-navy-dark mb-2">Admin Access</h2>
        <p className="text-gray-500 mb-8">Please enter your master password.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none transition-all"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="break-all">{error}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-navy-dark text-white font-bold py-4 rounded-xl hover:bg-brand-teal transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Unlock Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ token, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Function to handle deletion with Fallback
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    
    // Optimistic Update: Remove from UI immediately
    const originalBookings = [...bookings];
    setBookings(prev => prev.filter(b => b.id !== id));

    const deleteAttempt = async (method, url) => {
      const res = await safeFetch(url, {
        method: method,
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("Session Expired");
        throw new Error(`Failed: ${res.status}`);
      }
      return res;
    };

    try {
      // Try Standard DELETE
      await deleteAttempt('DELETE', `${API_URL}/api/bookings/${id}`);
    } catch (err) {
      console.warn("Standard DELETE failed, trying fallback POST...");
      try {
        // Try Fallback POST
        await deleteAttempt('POST', `${API_URL}/api/bookings/delete/${id}`);
      } catch (finalErr) {
        console.error("Both delete methods failed:", finalErr);
        // Revert UI if failure
        setBookings(originalBookings);
        if (finalErr.message === "Session Expired") {
            alert("Session expired. Please log out and log in again.");
            onLogout();
        } else {
            alert("Could not delete booking. Please check connection.");
        }
      }
    }
  };
  
  // NEW: Export to CSV (Blob Method)
  const handleExport = () => {
    if (!bookings.length) {
      alert("No bookings to export.");
      return;
    }

    const headers = ["ID", "Name", "Email", "Service", "Date", "Time", "Address", "Notes"];
    
    // Helper to escape CSV fields properly
    const safeCsv = (text) => `"${(text || '').toString().replace(/"/g, '""')}"`;

    const csvContent = [
      headers.join(","),
      ...bookings.map(b => [
        b.id,
        safeCsv(b.name),
        safeCsv(b.email),
        safeCsv(b.service),
        safeCsv(new Date(b.date).toLocaleDateString()),
        safeCsv(b.time),
        safeCsv(b.address),
        safeCsv(b.notes)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `signature_seal_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchBookings = (page = 1) => {
    setLoading(true);
    safeFetch(`${API_URL}/api/bookings?page=${page}&limit=9`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setBookings(data);
        } else if (data && data.data && Array.isArray(data.data)) {
            setBookings(data.data);
            setPagination(data.pagination);
        } else {
            setBookings([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings(1);
  }, [token]);

  return (
    <div className="container mx-auto px-6 py-24 min-h-screen bg-gray-50 pt-32">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
        <h2 className="text-4xl font-serif text-brand-navy-dark font-bold flex items-center gap-4">
          <div className="p-3 bg-white shadow-sm rounded-xl"><Lock className="w-8 h-8 text-brand-gold" /></div>
          Admin Portal
        </h2>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 text-sm font-bold text-brand-teal">
            {bookings.length} Active Bookings
          </div>
          
          {/* EXPORT BUTTON */}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-brand-navy-dark text-white px-4 py-3 rounded-full hover:bg-brand-gold transition-colors text-sm font-bold"
            title="Export to CSV (Excel/Sheets)"
          >
            <Download size={18} /> Export CSV
          </button>
          
          <button onClick={onLogout} className="bg-red-50 text-red-500 p-3 rounded-full hover:bg-red-100 transition-colors" title="Log Out">
            <LogOut size={20} />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="w-12 h-12 animate-spin text-brand-teal" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-gray-100 hover:-translate-y-1 transition-transform duration-300 relative group">
              {/* DELETE BUTTON - MOVED TO FOOTER FOR EASIER ACCESS */}
              <button 
                onClick={() => handleDelete(booking.id)}
                className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"
                title="Delete Booking"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex justify-between items-start mb-6">
                <span className={`text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide ${booking.service.includes('Loan') ? 'bg-purple-100 text-purple-600' : 'bg-brand-teal/10 text-brand-teal'}`}>
                  {booking.service}
                </span>
                <span className="text-xs text-gray-300 font-mono mr-8">#{booking.id.toString().padStart(4, '0')}</span>
              </div>
              <h3 className="text-2xl font-bold text-brand-navy-dark mb-1">{booking.name}</h3>
              <a href={`mailto:${booking.email}`} className="text-sm text-gray-400 hover:text-brand-teal transition-colors mb-6 block">{booking.email}</a>
              
              <div className="space-y-3 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600"><Calendar size={16} className="text-brand-gold" /> {new Date(booking.date).toLocaleDateString()}</div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600"><Clock size={16} className="text-brand-gold" /> {booking.time}</div>
                <div className="flex items-start gap-3 text-sm font-medium text-gray-600"><MapPin size={16} className="text-brand-gold mt-1" /> <span className="flex-1 line-clamp-2">{booking.address || "Virtual / No address"}</span></div>
              </div>
              
              {booking.notes && (
                <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500 italic">
                   "{booking.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-6 pb-20 pt-10">
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
    </div>
  );
};

// --- PAGE SECTIONS ---

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
          Professional, certified mobile notary services delivered to your doorstep. Accuracy you can rely on, on your schedule.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button onClick={() => onBookClick()} className="bg-brand-teal text-white font-bold text-lg px-12 py-5 rounded-full shadow-[0_0_40px_-10px_rgba(26,188,156,0.5)] hover:bg-teal-500 hover:scale-105 transition-all duration-300">
            Book Appointment
          </button>
          <a href="#services" className="bg-transparent border border-white/20 text-white font-bold text-lg px-12 py-5 rounded-full hover:bg-white hover:text-brand-navy-dark transition-all duration-300 backdrop-blur-sm">
            Our Services
          </a>
        </div>
        
        <div className="mt-24 pt-10 border-t border-white/10 flex justify-center gap-12 flex-wrap opacity-60 hover:opacity-100 transition-opacity duration-500">
          {['NNA Certified', 'Bonded & Insured', 'Background Checked'].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm font-semibold text-white tracking-wide">
              <div className="bg-brand-teal p-1 rounded-full"><Check className="w-3 h-3 text-white" /></div> {item}
            </div>
          ))}
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
      
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, margin: "-100px" }} 
        variants={staggerContainer} 
        className="grid md:grid-cols-3 gap-10"
      >
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
    {/* Decorative Elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-teal rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold rounded-full blur-[120px]"></div>
    </div>

    <div className="container mx-auto px-6 relative z-10">
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">The Signature Standard</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">We don't just stamp paper. We ensure peace of mind.</p>
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
        
        <div className="mt-16 text-center">
          <p className="text-gray-500">Need something custom? <button onClick={() => onBookClick()} className="text-brand-navy-dark font-bold border-b-2 border-brand-gold hover:text-brand-teal transition-colors">Contact us for a quote</button></p>
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
      
      <div className="flex justify-center gap-8 mb-12 font-medium text-gray-500">
        <a href="#services" className="hover:text-brand-teal transition-colors">Services</a>
        <a href="#why-us" className="hover:text-brand-teal transition-colors">About</a>
        <a href="#pricing" className="hover:text-brand-teal transition-colors">Pricing</a>
      </div>
      
      <div className="text-sm text-gray-400 flex flex-col items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Signature Seal Notary. All rights reserved.</p>
        <button onClick={() => onViewChange('admin')} className="text-gray-300 hover:text-brand-navy-dark transition-colors flex items-center gap-1">
          <Lock size={12} /> Admin
        </button>
      </div>
    </div>
  </footer>
);

// --- APP COMPONENT ---

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
