// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard, ChevronLeft,
  ChevronDown, FileText, HelpCircle, AlertTriangle, Navigation, PenTool, Mail, Coffee, Home, Briefcase, Info, QrCode, Scroll
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  if (import.meta.env.PROD) return 'https://signature-seal.onrender.com';
  return 'http://localhost:3001';
};

const API_URL = getBackendUrl();
const CONTACT_EMAIL = "sseal.notary@gmail.com"; 
const SITE_URL = "https://signaturesealnotaries.com";

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

// ==========================================
// SUB-COMPONENTS (Defined BEFORE App)
// ==========================================

// NEW: Credentials Section Component
const Credentials = () => (
  <section className="py-16 bg-white border-b border-gray-100">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center gap-12">
        
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block p-3 bg-teal-50 rounded-full mb-4">
            <Award className="text-brand-teal w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-brand-navy-dark mb-4">State Commissioned & Verified</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            We adhere to the strict standards of the West Virginia Secretary of State. 
            Our agents are fully exam-certified, background checked, and insured for your peace of mind.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2">
                <Check size={14} className="text-green-500"/> WV Commissioned
             </div>
             <div className="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2">
                <Check size={14} className="text-green-500"/> Exam Passed
             </div>
             <div className="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2">
                <Check size={14} className="text-green-500"/> E&O Insured
             </div>
          </div>
        </div>

        {/* Certificate Image Frame */}
        <div className="flex-1 w-full max-w-md">
            <div className="relative group cursor-pointer">
                {/* Decorative Background Offset */}
                <div className="absolute inset-0 bg-brand-teal/10 rounded-xl transform rotate-3 group-hover:rotate-2 transition-all duration-300"></div>
                
                {/* The Image Container */}
                <div className="relative bg-white p-2 rounded-xl shadow-lg border border-gray-100 transform transition-transform duration-300 group-hover:-translate-y-1">
                    {/* PLACEHOLDER IMAGE - Replace '/certificate.png' with your real file in public folder */}
                    <img 
                        src="/certificate.png" 
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/600x450/f1f5f9/334155?text=Certificate+Preview'; // Fallback if image missing
                        }}
                        alt="Notary Commission Certificate" 
                        className="rounded-lg w-full h-auto object-cover border border-gray-100"
                    />
                    
                    {/* Badge Overlay */}
                    <div className="absolute -bottom-4 -right-4 bg-brand-navy-dark text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold">
                        <Scroll size={14} className="text-brand-gold" /> Official Document
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  </section>
);

const QRModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(SITE_URL)}&color=2c3e50`;

    const downloadQR = async () => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'signature_seal_qr.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert("Could not download image automatically. Please screenshot it instead.");
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-brand-navy-dark/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                <h3 className="text-2xl font-serif font-bold text-brand-navy-dark mb-2">Scan to Book</h3>
                <p className="text-gray-500 text-sm mb-6">Share this code with clients for instant access.</p>
                <div className="bg-white border-4 border-brand-gold/20 rounded-2xl p-4 inline-block mb-6 shadow-inner">
                    <img src={qrUrl} alt="Signature Seal QR Code" className="w-48 h-48" />
                </div>
                <button onClick={downloadQR} className="w-full flex items-center justify-center gap-2 bg-brand-navy-dark text-white py-3 rounded-xl font-bold hover:bg-brand-teal transition-all">
                    <Download size={18} /> Download Image
                </button>
            </div>
        </div>
    );
};

// Floating Mobile Action Button
const FloatingBookButton = ({ onClick }) => (
  <div className="fixed bottom-8 left-4 right-4 z-[45] md:hidden pb-[env(safe-area-inset-bottom)]">
    <button 
      onClick={onClick}
      className="w-full bg-brand-teal text-white font-bold text-lg py-4 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors border-2 border-white/20"
    >
      <Calendar size={24} /> Book Appointment
    </button>
  </div>
);

const Navbar = ({ onBookClick, onViewChange, onQRClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRefresh = () => window.location.reload();

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/95 backdrop-blur-md border-gray-100 py-2' : 'bg-transparent border-transparent py-5'}`}>
      <div className="hidden md:flex container mx-auto px-6 justify-between items-center h-24"> 
        <div className="flex items-center gap-4 cursor-pointer group select-none" onClick={handleRefresh} title="Refresh Page">
          <div className={`w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-md ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold backdrop-blur-md'}`}>
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col justify-center items-center"> 
            <h1 className={`font-serif text-3xl font-bold leading-none tracking-tight text-center ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-xs leading-none tracking-[0.2em] uppercase font-bold mt-1.5 text-center ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>Mobile Notary</span>
          </div>
        </div>
        <div className="flex items-center space-x-8">
          {['Services', 'FAQ', 'Pricing'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className={`font-medium text-base transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>{item}</a>
          ))}
          <a href={`mailto:${CONTACT_EMAIL}`} className={`font-medium text-base transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>Contact</a>
          
          <button onClick={onQRClick} className={`p-2 rounded-full transition-colors ${scrolled ? 'text-brand-navy-dark hover:bg-gray-100' : 'text-white hover:bg-white/10'}`} title="Show QR Code">
             <QrCode size={24} />
          </button>

          <button onClick={() => onBookClick()} className={`font-bold px-8 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 text-base ${scrolled ? 'bg-brand-teal text-white shadow-lg' : 'bg-white text-brand-navy-dark shadow-xl'}`}>Book Now</button>
        </div>
      </div>
      
      {/* MOBILE */}
      <div className="md:hidden container mx-auto px-6 h-24 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="w-10">
            <button onClick={onQRClick} className={`p-2 ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>
                <QrCode size={24} />
            </button>
        </div>
        <div className="flex flex-row items-center gap-2 cursor-pointer justify-center" onClick={handleRefresh}>
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold'}`}>
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col justify-center items-start">
            <h1 className={`font-serif text-2xl font-black leading-none ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-[11px] uppercase font-bold mt-0.5 tracking-widest ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>Mobile Notary</span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-24 right-8 z-30 p-3 bg-brand-navy-dark text-white rounded-full shadow-xl hover:bg-brand-teal transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      title="Back to Top"
    >
      <ArrowUp size={24} />
    </button>
  );
};

// --- FAQ SECTION ---
const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  const faqs = [
    { q: "Why do I have to pay a travel fee upfront?", a: "Travel fees help us reserve your time and ensure we can reach you promptly, especially for first-time or long-distance appointments. Prepaying guarantees your slot and covers fuel/time for your appointment." },
    { q: "I’m close by. Do I still pay a travel fee?", a: "Travel fees are usually waived for repeat clients or appointments within a 10-mile radius. We aim to keep it fair and convenient for our local community." },
    { q: "Can I book a same-day or rush appointment?", a: "Yes! Travel fees are slightly higher for same-day or after-hours service, reflecting the premium for quick, reliable scheduling." },
    { q: "What ID do I need?", a: "A valid, unexpired government-issued photo ID is required. This includes Driver's Licenses, State IDs, or Passports. If you do not have an ID, we cannot perform the notarization." },
    { q: "Do you offer legal advice?", a: "No. We verify identity and witness signatures. We cannot explain legal documents, select forms for you, or provide legal advice." },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl font-serif font-bold text-brand-navy-dark text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setActiveIndex(activeIndex === i ? null : i)} className="w-full p-6 text-left flex justify-between items-center hover:bg-white transition-colors">
                <span className="font-bold text-brand-navy-dark">{faq.q}</span>
                <ChevronDown className={`text-brand-teal transition-transform duration-300 ${activeIndex === i ? 'rotate-180' : ''}`} size={20} />
              </button>
              <AnimatePresence>
                {activeIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
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
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hi! I'm the Concierge. I can help with I-9 Verification, Mobile Notary, and scheduling. How can I assist?" }]);
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
    <div className="fixed bottom-24 right-8 z-40 flex flex-col items-end font-sans">
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

const BookingModal = ({ isOpen, onClose, initialService, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    service: '', date: '', time: '', name: '', email: '', 
    address: '', notes: '', mileage: 0, signatures: 1,
    locationType: 'my_location' // Default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payNow, setPayNow] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => { 
    if (initialService) setFormData(prev => ({ ...prev, service: initialService })); 
    if (initialData) {
        setFormData(initialData);
        setStep(3);
    }
  }, [initialService, initialData]);

  const handleLocationTypeChange = (type) => {
    setFormData(prev => ({ 
        ...prev, 
        locationType: type,
        mileage: type === 'public' ? 0 : prev.mileage,
        address: ''
    }));
  };

  const isI9 = formData.service.includes('I-9');

  const price = useMemo(() => {
    let base = 40; // UNIFIED RESERVATION FEE
    if (formData.service.includes('Loan')) base = 150;
    
    const extraMiles = Math.max(0, (formData.mileage || 0) - 10);
    const surcharge = formData.locationType === 'public' ? 0 : (extraMiles * 2);
    
    // Calculate Due Later
    const dueLater = isI9 ? 25 : (formData.signatures || 0) * 10;
    
    return { 
        travelTotal: base + surcharge, 
        dueLater, 
        grandTotal: base + surcharge + dueLater 
    };
  }, [formData.service, formData.mileage, formData.signatures, formData.locationType, isI9]);

  const timeSlots = useMemo(() => {
    if (!formData.date) return [];
    const dateObj = new Date(formData.date + 'T12:00:00');
    const day = dateObj.getDay(); 
    if (day === 0) return []; 
    // Flexible Hours for I-9
    if (isI9) {
        const slots = [];
        for (let i = 9; i <= 19; i++) {
            const hour = i > 12 ? i - 12 : i;
            const ampm = i >= 12 ? 'PM' : 'AM';
            slots.push(`${hour}:00 ${ampm}`);
        }
        return slots;
    }
    // Standard
    if (day === 6) return ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    else return ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
  }, [formData.date, isI9]);

  // --- STRICT STEP VALIDATION ---
  const isStepValid = () => {
    if (step === 1) return formData.service && formData.date && formData.time;
    if (step === 2) {
        const basicFields = formData.name && formData.email && (isI9 || formData.signatures > 0);
        if (formData.locationType === 'my_location') {
            return basicFields && formData.address && !isNaN(formData.mileage);
        } else {
            return basicFields && formData.address;
        }
    }
    if (step === 3) return termsAccepted && payNow;
    return false;
  };

  if (!isOpen) return null;

  const submitBooking = async () => {
    if (!isStepValid()) return; 
    setIsSubmitting(true);
    const payload = { ...formData };
    
    try {
        localStorage.setItem('pendingBooking', JSON.stringify(payload));
    } catch (e) { console.warn("Storage failed", e); }
    
    try {
        await safeFetch(`${API_URL}/api/bookings`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
    } catch(e) { console.log("Lead capture failed, proceeding to payment anyway"); }

    const endpoint = `${API_URL}/api/create-checkout-session`;
    try {
      const res = await safeFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
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
            <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold font-serif text-brand-navy-dark">{step === 1 ? 'Service' : step === 2 ? 'Details' : 'Review & Terms'}</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {/* NO COURIER */}
                    {['Mobile Notary Service', 'I-9 Employment Verification', 'Oaths & Affirmations', 'Signature Witnessing'].map(svc => (
                      <button key={svc} onClick={() => setFormData({...formData, service: svc})} className={`p-4 rounded-xl text-left border-2 font-bold transition-all relative ${formData.service === svc ? 'border-brand-teal bg-teal-50 text-brand-navy-dark' : 'border-gray-100 hover:border-brand-teal/30'}`}>
                        {svc}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Select Date</label>
                        <input type="date" className="p-3 border-2 border-gray-100 rounded-xl w-full outline-none focus:border-brand-teal text-brand-navy-dark font-bold" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                         {/* DATE READOUT FOR MOBILE CLARITY */}
                        {formData.date && <p className="text-[10px] text-brand-teal font-medium pl-1">{new Date(formData.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Select Time</label>
                        <select className="p-3 border-2 border-gray-100 rounded-xl w-full outline-none focus:border-brand-teal" onChange={(e) => setFormData({...formData, time: e.target.value})} value={formData.time} disabled={!formData.date || timeSlots.length === 0}>
                        <option value="">Select Time</option>
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                  </div>
                  {/* I-9 SPECIFIC HOURS NOTE */}
                  {isI9 && (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-2 items-start text-xs text-blue-800">
                        <Info size={16} className="mt-0.5 shrink-0" />
                        <div><strong>Flexible Hours:</strong> I-9 Verifications are available Mon-Sat (9am-7pm).</div>
                    </div>
                  )}
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <input type="text" placeholder="Full Name" className="w-full p-4 border-2 border-gray-100 rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" className="w-full p-4 border-2 border-gray-100 rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  
                  {/* DYNAMIC LOCATION SELECTOR */}
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => handleLocationTypeChange('my_location')} className={`p-3 border-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors ${formData.locationType === 'my_location' ? 'border-brand-teal bg-teal-50 text-brand-navy-dark' : 'border-gray-100 text-gray-500'}`}>
                        <Home size={18} /> My Location
                     </button>
                     <button onClick={() => handleLocationTypeChange('public')} className={`p-3 border-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors ${formData.locationType === 'public' ? 'border-brand-teal bg-teal-50 text-brand-navy-dark' : 'border-gray-100 text-gray-500'}`}>
                        <Coffee size={18} /> Public Spot
                     </button>
                  </div>

                  {formData.locationType === 'public' && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {['Cabell County Library (Main)', 'Starbucks (3rd Ave)', 'Panera Bread (Rt 60)', 'Barboursville Library'].map(spot => (
                            <button key={spot} onClick={() => setFormData({...formData, address: spot})} className={`px-3 py-1 rounded-full hover:bg-brand-teal hover:text-white transition-colors ${formData.address === spot ? 'bg-brand-teal text-white' : 'bg-gray-100'}`}>{spot}</button>
                        ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`bg-gray-50 p-4 rounded-xl border border-gray-100 ${formData.locationType === 'public' ? 'opacity-50' : ''}`}>
                        <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                            <span>Travel Distance</span>
                            {formData.locationType === 'my_location' && (
                                <a href={`https://www.google.com/maps/dir/25701/${encodeURIComponent(formData.address || '')}`} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline flex items-center gap-1"><Navigation size={12}/> Check Map</a>
                            )}
                        </label>
                        <div className="flex items-center gap-2 mt-2">
                            <input 
                                type="number" min="0" 
                                className="w-20 p-2 border-2 border-gray-200 rounded-lg text-center font-bold outline-none focus:border-brand-teal disabled:bg-gray-200" 
                                value={formData.mileage} 
                                disabled={formData.locationType === 'public'} // LOCKED FOR PUBLIC SPOTS
                                onChange={(e) => setFormData({...formData, mileage: parseInt(e.target.value) || 0})} 
                            />
                            <span className="text-sm text-gray-600">miles from 25701</span>
                        </div>
                        {/* SURCHARGE DISCLAIMER */}
                        {formData.locationType === 'my_location' && (
                            <p className="text-[10px] text-gray-500 mt-2 italic leading-tight">
                                Base fee covers 10 miles. Excess mileage is charged at $2.00/mile.
                            </p>
                        )}
                    </div>
                    
                    {!isI9 && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <label className="text-xs font-bold text-gray-500 uppercase">Stamps / Certificates</label>
                            <div className="flex items-center gap-2 mt-2">
                                <PenTool size={18} className="text-brand-teal" />
                                <input type="number" min="1" className="w-20 p-2 border-2 border-gray-200 rounded-lg text-center font-bold outline-none focus:border-brand-teal" value={formData.signatures} onChange={(e) => setFormData({...formData, signatures: Math.max(1, parseInt(e.target.value) || 1)})} />
                                <span className="text-sm text-gray-600">($10 ea - at table)</span>
                            </div>
                        </div>
                    )}
                  </div>

                  <textarea 
                    placeholder={formData.locationType === 'public' ? "Preferred Public Location Name" : "Home/Office Address, City, Zip"} 
                    rows={2} 
                    className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-brand-teal transition-all" 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  />
                  
                  <textarea placeholder="Additional Notes (Optional)" rows={2} className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-brand-teal transition-all" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Due Online Now</p>
                            <p className="text-3xl font-bold text-brand-navy-dark">${price.travelTotal}</p>
                            <p className="text-xs text-gray-400">Travel Reservation Fee</p>
                        </div>
                        {price.dueLater > 0 && (
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Due at Appointment</p>
                                <p className="text-xl font-bold text-gray-600">${price.dueLater}</p>
                                <p className="text-xs text-gray-400">{isI9 ? 'Verification Fee' : 'Notary Fee'}</p>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 pt-2"><span className="font-bold">Includes:</span> {isI9 ? 'I-9 Travel Reservation' : 'Mobile Travel Fee'} to {formData.locationType === 'public' ? 'Public Spot' : `${formData.mileage} miles`}.</p>
                  </div>
                  
                  {/* MANDATORY COMPLIANCE CHECKBOXES */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border border-brand-gold/30 bg-orange-50/50 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 w-5 h-5 rounded accent-brand-gold" />
                        <span className="text-xs text-gray-700 leading-relaxed">
                            {isI9 
                                ? "I understand this is an Authorized Representative service for I-9 verification and is NOT a notarization. A separate $25 service fee is due at the appointment." 
                                : "Notarization fees are collected at the time of service ($10 per notarial act). Travel fees are prepaid to ensure your appointment is secure."}
                        </span>
                    </label>

                    <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-colors ${payNow ? 'border-brand-teal bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={payNow} onChange={e => setPayNow(e.target.checked)} className="w-6 h-6 rounded accent-brand-teal" />
                        <div className="flex-1"><span className="font-bold text-brand-navy-dark flex items-center gap-2"><CreditCard size={18}/> Pay Online</span><p className="text-xs text-gray-500">Secure Checkout via Stripe</p></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-between bg-white">
              <button onClick={() => setStep(s => s - 1)} className={`text-gray-400 font-bold px-6 py-2 ${step === 1 ? 'invisible' : ''}`}>Back</button>
              <button 
                onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} 
                disabled={!isStepValid()} // LOCK BUTTON UNTIL VALID
                className={`px-12 py-3.5 rounded-xl font-bold shadow-lg transition-all ${!isStepValid() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-navy-dark text-white hover:bg-brand-teal'}`}
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

// --- APP ROOT ---

function App() {
  const [view, setView] = useState('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken')); 
  const [isQRModalOpen, setIsQRModalOpen] = useState(false); 
  const [restoredData, setRestoredData] = useState(null);

  const handleBookingOpen = (service = null) => { if (service) setPreSelectedService(service); setIsBookingOpen(true); };
  const handleLogin = (token) => { localStorage.setItem('adminToken', token); setAdminToken(token); };
  const handleLogout = () => { localStorage.removeItem('adminToken'); setAdminToken(null); setView('home'); };

  // BACK BUTTON LOGIC: Check for ?canceled=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('canceled')) {
        try {
            const saved = localStorage.getItem('pendingBooking');
            if (saved) {
                setRestoredData(JSON.parse(saved));
                setIsBookingOpen(true); 
                window.history.replaceState({}, document.title, "/");
            }
        } catch(e) { console.warn("Storage parse error", e); }
    }
  }, []);

  // NEW: Scroll to top when view changes (Fixes Admin Login scroll issue)
  useEffect(() => {
    const timer = setTimeout(() => {
        window.scrollTo(0, 0);
    }, 10);
    return () => clearTimeout(timer);
  }, [view]);

  return (
    <div className="font-sans min-h-screen bg-white">
      <Navbar 
        onBookClick={() => handleBookingOpen()} 
        onViewChange={setView} 
        currentView={view} 
        onQRClick={() => setIsQRModalOpen(true)}
      />
      <main>
        {view === 'home' ? (
          <>
            <Hero onBookClick={() => handleBookingOpen()} />
            {/* CREDENTIALS SECTION INSERTED HERE */}
            <Credentials />
            <Services />
            <FAQ />
            <Pricing onBookClick={(service) => handleBookingOpen(service)} />
            <AIChatWidget onRecommend={(service) => handleBookingOpen(service)} />
          </>
        ) : (!adminToken ? <LoginScreen onLogin={handleLogin} /> : <AdminDashboard token={adminToken} onLogout={handleLogout} />)}
      </main>
      <Footer onViewChange={setView} />
      <BookingModal isOpen={isBookingOpen} onClose={() => { setIsBookingOpen(false); setRestoredData(null); }} initialService={preSelectedService} initialData={restoredData} />
      <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} /> 
      {/* Floating Button: Hide if Admin or Booking Open */}
      {!adminToken && !isBookingOpen && <FloatingBookButton onClick={() => handleBookingOpen()} />}
    </div>
  );
}

export default App;
