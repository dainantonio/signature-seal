// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard, ChevronLeft,
  ChevronDown, FileText, HelpCircle, AlertTriangle, Navigation, PenTool, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  if (import.meta.env.PROD) return 'https://signature-seal.onrender.com';
  return 'http://localhost:3001';
};

const API_URL = getBackendUrl();
// UPDATE THIS: The email where "Contact Us" clicks will go
const CONTACT_EMAIL = "sseal.notary@gmail.com"; 

// --- SAFE FETCH HELPER ---
const safeFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      throw new Error("Server returned HTML instead of JSON. Please check API URL.");
    }
    return res;
  } catch (err) {
    throw new Error(err.message === "Failed to fetch" ? "Server unreachable. Ensure Render is Live." : err.message);
  }
};

// --- ANIMATION VARS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// --- COMPONENTS ---

const Navbar = ({ onBookClick, onViewChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/95 backdrop-blur-md border-gray-100 py-2' : 'bg-transparent border-transparent py-5'}`}>
      <div className="hidden md:flex container mx-auto px-6 justify-between items-center h-24"> 
        <div className="flex items-center gap-4 cursor-pointer group select-none" onClick={() => onViewChange('home')}>
          <div className={`w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-md ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold backdrop-blur-md'}`}>
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col justify-center items-center"> 
            <h1 className={`font-serif text-3xl font-bold leading-none tracking-tight text-center ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-xs leading-none tracking-[0.2em] uppercase font-bold mt-1.5 text-center ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>WV Mobile Notary</span>
          </div>
        </div>
        <div className="flex items-center space-x-10">
          {['Services', 'FAQ', 'Pricing'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className={`font-medium text-base transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>{item}</a>
          ))}
          {/* Direct Email Link */}
          <a href={`mailto:${CONTACT_EMAIL}`} className={`font-medium text-base transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>Contact</a>
          <button onClick={() => onBookClick()} className={`font-bold px-8 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 text-base ${scrolled ? 'bg-brand-teal text-white shadow-lg' : 'bg-white text-brand-navy-dark shadow-xl'}`}>Book Now</button>
        </div>
      </div>
      
      {/* MOBILE */}
      <div className="md:hidden container mx-auto px-6 h-24 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="w-10"></div>
        <div className="flex flex-row items-center gap-3 cursor-pointer justify-center" onClick={() => onViewChange('home')}>
           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold'}`}>
            <Award className="w-6 h-6" />
          </div>
          <div className="flex flex-col justify-center items-center">
            <h1 className={`font-serif text-xl font-bold leading-none ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-[10px] uppercase font-bold mt-1 tracking-widest ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>WV Notary</span>
          </div>
        </div>
        <div className="justify-self-end">
          <button className={`p-2 ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`} onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X size={28} /> : <Menu size={28} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden fixed top-0 left-0 w-full h-screen bg-white z-40 flex flex-col items-center justify-center space-y-8">
             {['Services', 'FAQ', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsOpen(false)} className="text-3xl font-serif font-bold text-brand-navy-dark hover:text-brand-teal">{item}</a>
            ))}
             <a href={`mailto:${CONTACT_EMAIL}`} className="text-3xl font-serif font-bold text-brand-navy-dark hover:text-brand-teal">Contact Us</a>
            <button onClick={() => { onBookClick(); setIsOpen(false); }} className="bg-brand-teal text-white font-bold px-10 py-4 rounded-full text-xl shadow-xl">Book Appointment</button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- FAQ SECTION ---
const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  const faqs = [
    { q: "What ID do I need?", a: "A valid, unexpired government-issued photo ID is required. This includes Driver's Licenses, State IDs, or Passports." },
    { q: "Where do you travel?", a: "We serve Huntington, WV and surrounding areas. We can meet you at your home, office, a hospital, or a local coffee shop." },
    { q: "How does pricing work?", a: "We charge a standard Travel Fee (starting at $40) to come to you. The state-regulated Notary Fee ($10 per stamp) is separate and collected at the appointment." },
    { q: "Do you offer legal advice?", a: "No. As notaries, we verify identity and witness signatures. We cannot explain legal documents or provide legal advice." },
    { q: "How do I pay?", a: "You can pay the Travel Fee online via credit card to secure your booking. The remaining Notary Fees are paid in-person (Cash, Card, or Check)." }
  ];

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl font-serif font-bold text-brand-navy-dark text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setActiveIndex(activeIndex === i ? null : i)} className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="font-bold text-brand-navy-dark">{faq.q}</span>
                <ChevronDown className={`text-brand-teal transition-transform duration-300 ${activeIndex === i ? 'rotate-180' : ''}`} size={20} />
              </button>
              <AnimatePresence>
                {activeIndex === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="p-6 pt-0 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AIChatWidget = ({ onRecommend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hi! I'm the Concierge. I can help with pricing, service areas, and scheduling. How can I assist?" }]);
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
    } catch (err) { setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting. Please use the 'Book Now' button." }]); } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl mb-6 w-[90vw] md:w-96 border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-brand-navy-dark p-4 flex items-center gap-3 text-white shadow-md z-10">
              <h3 className="font-bold text-sm">Notary Concierge</h3>
              <button onClick={() => setIsOpen(false)} className="ml-auto hover:bg-white/10 p-1 rounded transition"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 text-sm">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-teal text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'}`}>
                    <p>{msg.text}</p>
                    {msg.recommendation && msg.recommendation.action === 'book_general' && (
                      <button onClick={() => { setIsOpen(false); onRecommend(msg.recommendation.service); }} className="w-full bg-brand-navy-dark text-white text-[10px] py-2 rounded font-bold mt-3 uppercase tracking-wider">Book Now</button>
                    )}
                     {msg.recommendation && msg.recommendation.action === 'contact_us' && (
                        <a href={`mailto:${CONTACT_EMAIL}`} className="block text-center w-full bg-brand-gold text-white text-[10px] py-2 rounded font-bold mt-3 uppercase tracking-wider">Email Us</a>
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
  const [formData, setFormData] = useState({ service: '', date: '', time: '', name: '', email: '', address: '', notes: '', mileage: 0, signatures: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payNow, setPayNow] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => { if (initialService) setFormData(prev => ({ ...prev, service: initialService })); }, [initialService]);

  // Price Calculation - SAFE (No crash if service is missing)
  const price = useMemo(() => {
    let base = 40;
    if (formData.service && formData.service.includes('Loan')) base = 150;
    
    // Surcharge Logic
    const extraMiles = Math.max(0, (formData.mileage || 0) - 10);
    const surcharge = extraMiles * 2;
    
    // Notary Fee ($10/sig) - for display only
    const notaryFee = (formData.signatures || 0) * 10;
    
    return { 
        travelTotal: base + surcharge, 
        notaryFee, 
        grandTotal: base + surcharge + notaryFee 
    };
  }, [formData.service, formData.mileage, formData.signatures]);

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
    if (!termsAccepted) {
        alert("Please accept the pricing terms to proceed.");
        return;
    }
    setIsSubmitting(true);
    const payload = { ...formData };
    const endpoint = payNow ? `${API_URL}/api/create-checkout-session` : `${API_URL}/api/bookings`;
    try {
      const res = await safeFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        if (payNow && data.url) window.location.href = data.url;
        else setSuccess(true);
      } else { alert(data.error || "Submission failed."); }
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

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
              <h2 className="text-xl font-bold font-serif text-brand-navy-dark">{step === 1 ? 'Service' : step === 2 ? 'Details' : 'Review & Terms'}</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {['Mobile Notary Service', 'Oaths & Affirmations', 'Signature Witnessing', 'General Notary (Other)'].map(svc => (
                      <button key={svc} onClick={() => setFormData({...formData, service: svc})} className={`p-4 rounded-xl text-left border-2 font-bold transition-all relative ${formData.service === svc ? 'border-brand-teal bg-teal-50 text-brand-navy-dark' : 'border-gray-100 hover:border-brand-teal/30'}`}>
                        {svc}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <input type="date" className="p-3 border-2 border-gray-100 rounded-xl w-full outline-none focus:border-brand-teal" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                    <select className="p-3 border-2 border-gray-100 rounded-xl w-full outline-none focus:border-brand-teal" onChange={(e) => setFormData({...formData, time: e.target.value})} value={formData.time} disabled={!formData.date || timeSlots.length === 0}>
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <input type="text" placeholder="Full Name" className="w-full p-4 border-2 border-gray-100 rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" className="w-full p-4 border-2 border-gray-100 rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                            <span>Travel Distance</span>
                            <a href={`https://www.google.com/maps/dir/25701/${encodeURIComponent(formData.address || '')}`} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline flex items-center gap-1"><Navigation size={12}/> Check Map</a>
                        </label>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="number" min="0" className="w-20 p-2 border-2 border-gray-200 rounded-lg text-center font-bold outline-none focus:border-brand-teal" value={formData.mileage} onChange={(e) => setFormData({...formData, mileage: parseInt(e.target.value) || 0})} />
                            <span className="text-sm text-gray-600">miles from 25701</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="text-xs font-bold text-gray-500 uppercase">Signatures Needed</label>
                        <div className="flex items-center gap-2 mt-2">
                            <PenTool size={18} className="text-brand-teal" />
                            <input type="number" min="1" className="w-20 p-2 border-2 border-gray-200 rounded-lg text-center font-bold outline-none focus:border-brand-teal" value={formData.signatures} onChange={(e) => setFormData({...formData, signatures: Math.max(1, parseInt(e.target.value) || 1)})} />
                            <span className="text-sm text-gray-600">($10 ea - at table)</span>
                        </div>
                    </div>
                  </div>

                  <textarea placeholder="Meeting Address (Huntington area)" rows={3} className="w-full p-4 border-2 border-gray-100 rounded-xl" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  <textarea placeholder="Additional Notes (Optional)" rows={2} className="w-full p-4 border-2 border-gray-100 rounded-xl" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Due Online Now</p>
                            <p className="text-3xl font-bold text-brand-navy-dark">${price.travelTotal}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Due at Appointment</p>
                             <p className="text-xl font-bold text-gray-600">${price.notaryFee}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 pt-2"><span className="font-bold">Includes:</span> Travel to {formData.mileage} miles & Service Fee.</p>
                  </div>
                  
                  {/* MANDATORY COMPLIANCE CHECKBOX */}
                  <label className="flex items-start gap-3 p-4 border border-brand-gold/30 bg-orange-50/50 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 w-5 h-5 rounded accent-brand-gold" />
                    <span className="text-xs text-gray-700 leading-relaxed">
                        I understand that the <strong>Travel Fee (${price.travelTotal})</strong> is due now to secure the appointment. The <strong>Notary Fee ($10 per signature)</strong> is regulated by WV law and will be collected separately after the notarization is completed.
                    </span>
                  </label>

                  <label className="flex items-center gap-4 p-5 border-2 border-brand-teal/20 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors">
                    <input type="checkbox" checked={payNow} onChange={e => setPayNow(e.target.checked)} className="w-6 h-6 rounded accent-brand-teal" />
                    <div className="flex-1"><span className="font-bold text-brand-navy-dark flex items-center gap-2"><CreditCard size={18}/> Pay Travel Fee Online</span><p className="text-xs text-gray-500">Secure Checkout via Stripe</p></div>
                  </label>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-between bg-white">
              <button onClick={() => setStep(s => s - 1)} className={`text-gray-400 font-bold px-6 py-2 ${step === 1 ? 'invisible' : ''}`}>Back</button>
              <button 
                onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} 
                disabled={step === 3 && !termsAccepted} // DISABLE IF NOT CHECKED
                className={`px-12 py-3.5 rounded-xl font-bold shadow-lg transition-all ${step === 3 && !termsAccepted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-navy-dark text-white hover:bg-brand-teal'}`}
              >
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
    <div className="container mx-auto px-6 relative z-10 pt-40 md:pt-20 text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-brand-gold text-[10px] font-bold uppercase tracking-widest mb-10 border border-white/10">Serving Huntington, WV & South Point, OH</div>
        <h1 className="text-5xl md:text-8xl font-bold text-white font-serif mb-8 leading-tight tracking-tight">Trust in Every <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-gold">Signature.</span></h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">Certified mobile notary services delivered to your doorstep in West Virginia. Accurate, bonded, and ready.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button onClick={() => onBookClick()} className="bg-brand-teal text-white font-bold px-12 py-5 rounded-full hover:scale-105 transition-all shadow-2xl shadow-brand-teal/40 text-lg">Book WV Appointment</button>
          <a href={`mailto:${CONTACT_EMAIL}`} className="border-2 border-white/20 text-white font-bold px-12 py-5 rounded-full hover:bg-white/10 transition-all text-lg backdrop-blur-sm text-center flex items-center justify-center gap-2"><Mail size={18}/> Questions? Email Us</a>
        </div>
      </motion.div>
    </div>
  </section>
);

const Services = () => (
  <section id="services" className="py-32 bg-white relative">
    <div className="container mx-auto px-6">
      <div className="text-center mb-24 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-navy-dark mb-6 tracking-tight">WV Expertise</h2>
        <p className="text-xl text-gray-500">Comprehensive legal signing solutions tailored to your schedule in West Virginia.</p>
      </div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-10">
        {[
          { icon: Car, title: "Mobile Notary", desc: "Traveling to homes, offices, or hospitals across WV." },
          { icon: FileText, title: "Oaths & Affirmations", desc: "Administering oaths for affidavits and sworn statements." },
          { icon: ShieldCheck, title: "Signature Witnessing", desc: "Acting as an impartial witness for sensitive documents." }
        ].map((s, i) => (
          <motion.div key={i} variants={fadeInUp} className="p-10 rounded-[2.5rem] bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-gray-100 text-center">
            <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-sm"><s.icon className="text-brand-navy-dark" size={36}/></div>
            <h3 className="text-2xl font-bold text-brand-navy-dark mb-4">{s.title}</h3>
            <p className="text-gray-500 leading-relaxed text-sm">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const Pricing = ({ onBookClick }) => (
  <section id="pricing" className="py-32 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-20"><h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-navy-dark mb-4 tracking-tight">Transparent Pricing</h2><p className="text-xl text-gray-500">West Virginia local service.</p></div>
      <div className="max-w-md mx-auto">
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center group hover:shadow-xl transition-all">
          <span className="text-xs font-bold text-brand-teal uppercase tracking-widest mb-4">Mobile Service (WV)</span>
          <h3 className="text-3xl font-bold mb-6 text-brand-navy-dark">Mobile Notary</h3>
          <div className="text-4xl font-serif font-bold mb-10 text-brand-navy-dark group-hover:scale-105 transition-transform">From $40</div>
          <ul className="space-y-4 mb-12 text-gray-600 w-full text-sm">
            {['$10 per notarized signature (State Fee)', 'Travel included up to 10 miles', '$2.00/mile surcharge over 10 miles', 'Evening & Weekends Available'].map(item => (
              <li key={item} className="flex items-center gap-3 font-medium"><Check size={18} className="text-brand-teal"/> {item}</li>
            ))}
          </ul>
          <button onClick={() => onBookClick('Mobile Notary Service')} className="w-full py-5 rounded-2xl border-2 border-brand-navy-dark text-brand-navy-dark font-bold hover:bg-brand-navy-dark hover:text-white transition-all text-lg">Book WV Standard</button>
          <div className="text-[10px] text-gray-400 mt-6 text-center italic border-t pt-4 w-full">
            Travel fees are disclosed at booking. Notary fees are regulated by West Virginia law at $10 per notarized signature and are collected after the notarization is completed.
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = ({ onViewChange }) => (
  <footer className="bg-white border-t border-gray-100 py-20 text-center">
    <div className="inline-block p-4 bg-gray-50 rounded-2xl mb-8"><Award className="text-brand-gold" size={40}/></div>
    <h2 className="font-serif text-3xl font-bold text-brand-navy-dark mb-10">Signature Seal Notary</h2>
    <div className="flex justify-center gap-10 mb-12 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
      <a href="#services" className="hover:text-brand-teal">Services</a>
      <a href="#faq" className="hover:text-brand-teal">FAQ</a>
      <a href="#pricing" className="hover:text-brand-teal">Pricing</a>
    </div>
    <p className="text-gray-400 text-xs font-medium">© {new Date().getFullYear()} Signature Seal Notaries. Licensed in West Virginia.</p>
    <button onClick={() => onViewChange('admin')} className="mt-10 text-xs text-gray-200 hover:text-brand-navy-dark flex items-center justify-center gap-1 mx-auto"><Lock size={12}/> Admin Portal</button>
  </footer>
);

// ADMIN
const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await safeFetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (res.ok) onLogin(data.token); else alert("Incorrect.");
    } catch (err) { alert("Offline."); }
  };
  return <div className="min-h-screen bg-brand-navy-dark flex items-center justify-center"><form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-4 border rounded-xl" placeholder="Admin Password"/><button className="w-full bg-brand-navy-dark text-white mt-4 p-4 rounded-xl font-bold">Login</button></form></div>;
};

const AdminDashboard = ({ token, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API_URL}/api/bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => { setBookings(Array.isArray(data) ? data : (data.data || [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);
  const handleDelete = async (id) => {
    if(!window.confirm("Delete?")) return;
    setBookings(prev => prev.filter(b => b.id !== id));
    await fetch(`${API_URL}/api/bookings/delete/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  };
  const handleExport = () => {
    const csv = "ID,Name,Service,Date\n" + bookings.map(b => `${b.id},${b.name},${b.service},${b.date}`).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = "bookings.csv";
    link.click();
  };
  return (
    <div className="container mx-auto px-6 py-32 pt-40">
      <div className="flex justify-between mb-8"><h2 className="text-3xl font-bold">Admin</h2><div className="flex gap-4"><button onClick={handleExport}><Download/></button><button onClick={onLogout} className="text-red-500"><LogOut/></button></div></div>
      <div className="grid md:grid-cols-3 gap-6">{bookings.map(b => (
        <div key={b.id} className="bg-white p-6 rounded-2xl shadow border relative"><button onClick={() => handleDelete(b.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button><h3 className="font-bold">{b.name}</h3><p className="text-sm">{b.service}</p><p className="text-xs text-gray-500">{new Date(b.date).toLocaleDateString()}</p></div>
      ))}</div>
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
    if (window.location.search.includes('success=true')) { alert("Payment Successful! Your appointment is confirmed."); window.history.replaceState({}, document.title, "/"); }
  }, []);

  return (
    <div className="font-sans min-h-screen bg-white">
      <Navbar onBookClick={() => handleBookingOpen()} onViewChange={setView} currentView={view} />
      <main>
        {view === 'home' ? (
          <>
            <Hero onBookClick={() => handleBookingOpen()} />
            <Services />
            <FAQ />
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

export default App;
