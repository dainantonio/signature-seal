// filename: client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, Menu, X, Check, Car, FileSignature, ShieldCheck, 
  MessageSquare, Send, Loader2, MapPin, Lock, Calendar, 
  Clock, ArrowRight, Star, ChevronRight, LogOut, Key, AlertCircle, Trash2, Download, CreditCard, ChevronLeft,
  ChevronDown, FileText, HelpCircle, AlertTriangle, Navigation, PenTool, Mail, Coffee, Home, Briefcase, Info, QrCode, Search, PhoneCall, CheckCircle2, Zap, Building2, Shield, Camera, FileCheck
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
const PHONE_NUMBER = "(304) 982-4165"; 
const PHONE_LINK = "tel:+13049824165"; 

const FAQ_ITEMS = [
  { q: "How much does a mobile notary cost?", a: "We charge a standard Travel Reservation Fee ($40 base) to dispatch our agent immediately to your location. State notary fees are collected separately at the appointment ($10/stamp in WV, $5/stamp in OH/KY)." },
  { q: "What do I need to bring?", a: "You must provide a valid, unexpired government-issued photo ID (Driver's License, State ID, or Passport). All signers must be physically present." },
  { q: "Can you come to a hospital or nursing home?", a: "Yes, we specialize in facility visits. We frequently visit local hospitals, assisted living facilities, and rehabilitation centers. Please ensure the signer is alert, aware of what they are signing, and has valid ID." },
  { q: "Do you offer same-day service?", a: "Yes! We offer same-day, after-hours, and weekend appointments subject to availability. Call us immediately for urgent requests." },
  { q: "Is I-9 Verification notarized?", a: "No. Form I-9 verification is an Authorized Representative service, not a notarial act. We charge a flat fee for this service." },
];

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
// SUB-COMPONENTS
// ==========================================

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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-brand-navy-dark/90 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                <h3 className="text-2xl font-serif font-bold text-brand-navy-dark mb-2">Scan to Book</h3>
                <p className="text-gray-500 text-sm mb-6">Share this code with clients for instant access.</p>
                <div className="bg-white border-4 border-brand-gold/20 rounded-3xl p-4 inline-block mb-6 shadow-inner">
                    <img src={qrUrl} alt="Signature Seal QR Code" className="w-48 h-48" />
                </div>
                <button onClick={downloadQR} className="w-full flex items-center justify-center gap-2 bg-brand-navy-dark text-white py-4 rounded-2xl font-bold hover:bg-brand-teal transition-all">
                    <Download size={18} /> Download Image
                </button>
            </div>
        </div>
    );
};


const StructuredData = () => {
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Signature Seal Notary",
    url: SITE_URL,
    telephone: "+1-304-982-4165",
    areaServed: ["Huntington, WV", "Ashland, KY", "Proctorville, OH"],
    serviceType: ["Mobile Notary", "I-9 Verification", "Field Inspection"],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </>
  );
};

// Fixed Mobile Action Bar (Zero Friction CTA)
const FloatingBookButton = ({ onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener("scroll", toggleVisibility);
    toggleVisibility(); 
    
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[45] md:hidden bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex gap-3 transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
      <a href={PHONE_LINK} className="flex-[0.35] bg-brand-navy-dark text-brand-gold font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg active:scale-95">
          <PhoneCall size={20} /> Call
      </a>
      <button 
        onClick={() => onClick()}
        className="flex-[0.65] bg-brand-teal text-white font-bold text-[17px] py-4 rounded-2xl shadow-lg shadow-brand-teal/30 flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors active:scale-95"
      >
        <Calendar size={20} /> Book Online
      </button>
    </div>
  );
};

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
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/95 backdrop-blur-xl border-gray-200 py-3' : 'bg-transparent border-transparent py-5'}`}>
      <div className="hidden lg:flex container mx-auto px-6 justify-between items-center"> 
        <div className="flex items-center gap-4 cursor-pointer group select-none" onClick={handleRefresh} title="Refresh Page">
          <div className={`w-12 h-12 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-md ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold backdrop-blur-md'}`}>
            <Award className="w-7 h-7" />
          </div>
          <div className="flex flex-col justify-center"> 
            <h1 className={`font-serif text-2xl font-bold leading-none tracking-tight ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-[10px] leading-none tracking-[0.2em] uppercase font-bold mt-1.5 ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>Tri-State Notary & Inspections</span>
          </div>
        </div>
        <div className="flex items-center space-x-8">
          {['Services', 'Coverage', 'Pricing', 'FAQ'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className={`font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:text-brand-teal ${scrolled ? 'text-gray-600' : 'text-gray-200'}`}>{item}</a>
          ))}
          
          <button onClick={onQRClick} className={`p-2.5 rounded-full transition-colors ${scrolled ? 'text-brand-navy-dark bg-gray-100 hover:bg-gray-200' : 'text-white bg-white/10 hover:bg-white/20'}`} title="Show QR Code">
             <QrCode size={18} />
          </button>

          <div className="flex items-center gap-4 border-l-2 pl-8 border-gray-400/30">
              <a href={PHONE_LINK} className={`font-black text-lg flex items-center gap-2 transition-colors ${scrolled ? 'text-brand-navy-dark hover:text-brand-teal' : 'text-white hover:text-brand-gold'}`}>
                  <PhoneCall size={20} className={scrolled ? 'text-brand-teal' : 'text-brand-gold'} /> {PHONE_NUMBER}
              </a>
              <button onClick={() => onBookClick()} className={`font-bold px-8 py-3.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 text-sm uppercase tracking-wide ${scrolled ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/30' : 'bg-white text-brand-navy-dark shadow-xl'}`}>Book Now</button>
          </div>
        </div>
      </div>
      
      {/* MOBILE HEADER - Premium alignment */}
      <div className="lg:hidden container mx-auto px-4 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <button onClick={onQRClick} className={`p-2 rounded-full ${scrolled ? 'bg-gray-100 text-brand-navy-dark' : 'bg-white/10 text-white'}`}>
            <QrCode size={18} />
        </button>
        <div className="flex flex-row items-center gap-3 cursor-pointer justify-center" onClick={handleRefresh}>
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${scrolled ? 'bg-brand-navy-dark text-brand-gold' : 'bg-white/10 text-brand-gold'}`}>
            <Award className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center items-start">
            <h1 className={`font-serif text-lg font-black leading-none ${scrolled ? 'text-brand-navy-dark' : 'text-white'}`}>Signature Seal</h1>
            <span className={`text-[9px] uppercase font-bold mt-1 tracking-widest ${scrolled ? 'text-brand-teal' : 'text-gray-300'}`}>Tri-State Notary</span>
          </div>
        </div>
        <button className={`p-2 rounded-full ${scrolled ? 'bg-gray-100 text-brand-navy-dark' : 'bg-white/10 text-white'}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="lg:hidden fixed top-[72px] left-0 w-full h-[calc(100vh-72px)] bg-brand-navy-dark/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 p-6">
             <a href={PHONE_LINK} className="text-4xl font-black text-brand-gold mb-4 flex items-center gap-3 bg-white/10 px-8 py-4 rounded-3xl active:scale-95 transition-transform"><PhoneCall size={28}/> Call Now</a>
             {['Services', 'Coverage', 'Pricing', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsOpen(false)} className="text-2xl font-serif font-bold text-white hover:text-brand-teal w-full text-center py-2">{item}</a>
            ))}
             <button onClick={() => {setIsOpen(false); onBookClick();}} className="bg-brand-teal text-white w-full py-5 rounded-2xl font-bold text-xl mt-4 shadow-lg shadow-brand-teal/20 active:scale-95 transition-transform">Book Appointment</button>
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
      <ArrowRight size={24} className="-rotate-90" />
    </button>
  );
};

// --- FAQ SECTION ---
const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  

  return (
    <section id="faq" className="py-24 bg-slate-50 border-t border-gray-200">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-serif font-black text-brand-navy-dark text-center mb-12 tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setActiveIndex(activeIndex === i ? null : i)} className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors focus:outline-none">
                <span className="font-bold text-brand-navy-dark text-lg pr-4">{faq.q}</span>
                <div className={`p-2 rounded-full transition-colors duration-300 ${activeIndex === i ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <ChevronDown className={`transition-transform duration-300 ${activeIndex === i ? 'rotate-180' : ''}`} size={20} />
                </div>
              </button>
              <AnimatePresence>
                {activeIndex === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="p-6 pt-0 text-gray-600 leading-relaxed text-base">{faq.a}</p>
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
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hi! I'm the Concierge. I can help with Field Inspections, Mobile Notary (WV-OH-KY), and scheduling. How can I assist?" }]);
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
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 flex flex-col items-end font-sans pb-[env(safe-area-inset-bottom)]">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl mb-4 w-[calc(100vw-2rem)] md:w-[400px] border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-brand-navy-dark p-4 flex items-center gap-3 text-white shadow-md z-10">
              <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-brand-navy-dark"><Award size={16}/></div>
              <h3 className="font-bold text-base">Notary Concierge</h3>
              <button onClick={() => setIsOpen(false)} className="ml-auto bg-white/10 p-2 rounded-full hover:bg-white/20 transition active:scale-95"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-sm">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-brand-teal text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'}`}>
                    <p className="leading-relaxed text-[15px]">{msg.text}</p>
                    {msg.recommendation && msg.recommendation.action === 'book_general' && (
                      <button onClick={() => { setIsOpen(false); onRecommend({service: msg.recommendation.service, prefillLocation: msg.recommendation.prefillLocation}); }} className="w-full bg-brand-navy-dark text-white py-3 rounded-xl font-bold mt-4 shadow-md active:scale-95 transition-transform">Book Now</button>
                    )}
                     {msg.recommendation && msg.recommendation.action === 'contact_us' && (
                        <a href={PHONE_LINK} className="block text-center w-full bg-brand-gold text-brand-navy-dark py-3 rounded-xl font-bold mt-4 shadow-md active:scale-95 transition-transform">Call Us Now</a>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all" />
              <button type="submit" disabled={isLoading} className="p-3 bg-brand-navy-dark text-white rounded-xl shadow-md active:scale-95 transition-transform"><Send size={20} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-brand-navy-dark text-white p-4 rounded-full shadow-[0_10px_25px_rgba(29,45,62,0.4)] hover:scale-105 active:scale-95 transition-all border-2 border-brand-teal">
          <MessageSquare size={28} />
      </button>
    </div>
  );
};

const SmartHeroInput = ({ onBookClick }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setIsLoading(true);
        try {
            const res = await safeFetch(`${API_URL}/api/recommend`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ query: input }) 
            });
            const data = await res.json();
            // Pass the entire data object to populate the modal
            onBookClick(data);
        } catch (err) {
            console.error("Agentic booking failed:", err);
            // Fallback to empty modal
            onBookClick();
        } finally {
            setIsLoading(false);
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mt-8 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={20} />
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="E.g., I need a notary at St. Mary's hospital tomorrow..." 
                        className="w-full bg-white/90 text-brand-navy-dark placeholder-gray-500 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-gold transition-all text-base md:text-lg"
                        disabled={isLoading}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading || !input.trim()} 
                    className="w-full sm:w-auto bg-brand-gold text-brand-navy-dark font-black px-8 py-4 rounded-2xl hover:-translate-y-1 transition-transform shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Instant Book'}
                </button>
            </div>
            <p className="text-sm text-gray-300 mt-3 font-medium text-center">
                ✨ Our AI instantly sets up your appointment. Try it out.
            </p>
        </form>
    );
}

const BookingModal = ({ isOpen, onClose, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    service: '', date: '', time: '', name: '', email: '', 
    street: '', city: '', zip: '', state: 'WV', 
    notes: '', mileage: 0, signatures: 1, locationType: 'my_location'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payNow, setPayNow] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // High Priority Alerts
  const [priorityAlert, setPriorityAlert] = useState(null);

  // Initialize from Agentic Data
  useEffect(() => { 
    if (isOpen) {
        if (initialData) {
             setFormData(prev => ({ 
                 ...prev, 
                 service: initialData.service || prev.service,
                 notes: initialData.prefillLocation ? `Requested Location: ${initialData.prefillLocation}` : prev.notes
             }));
             
             // Handle Agentic Alerts
             if (initialData.prefillLocation && initialData.prefillLocation.toLowerCase().includes('hospital')) {
                 setPriorityAlert("Please ensure the patient is alert, aware, and possesses a valid physical ID.");
             } else if (initialData.service && initialData.service.includes('Estate')) {
                 setPriorityAlert("Remember: Wills and Trusts often require witnesses. We can witness, but additional witnesses may be needed depending on state law.");
             } else {
                 setPriorityAlert(null);
             }
        }
        // If returning from stripe cancel, initialData has a specific shape
        if(initialData && initialData.email){
             setFormData(initialData);
             setStep(3);
        } else {
             setStep(1); // Default to step 1 on new open
        }
    }
  }, [isOpen, initialData]);

  // --- AUTO MILEAGE CALCULATION AGENT ---
  const calculateMileage = async () => {
    const addressToGeocode = `${formData.street} ${formData.city} ${formData.state} ${formData.zip}`.trim();
    if (addressToGeocode.length < 10) return;

    setIsCalculating(true);
    try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToGeocode)}`);
        const geoData = await geoRes.json();
        if (!geoData || geoData.length === 0) {
            console.warn("Geocode mapping failed");
            setIsCalculating(false);
            return;
        }
        const destLat = geoData[0].lat;
        const destLon = geoData[0].lon;
        
        // Base Location: 1020 County Rd 3, Chesapeake, OH
        const startLat = 38.4357;
        const startLon = -82.4641;

        const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=false`);
        const routeData = await routeRes.json();

        if (routeData.code === 'Ok' && routeData.routes.length > 0) {
            const meters = routeData.routes[0].distance;
            const miles = (meters * 0.000621371).toFixed(2);
            setFormData(prev => ({ ...prev, mileage: miles }));
        }
    } catch (e) {
        console.error("Mileage Agent Error:", e);
    } finally {
        setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (formData.street && formData.city && formData.zip && formData.zip.length >= 5) {
        const timer = setTimeout(() => calculateMileage(), 1500);
        return () => clearTimeout(timer);
    }
  }, [formData.street, formData.city, formData.zip, formData.state]);

  const serviceName = formData.service || '';
  const isI9 = serviceName.includes('I-9');
  const isInspection = serviceName.includes('Field Inspection');
  const isLoan = serviceName.includes('Loan');

  const price = useMemo(() => {
    let base = 40; 
    if (isLoan) base = 150;
    if (isInspection) base = 50; 
    
    const miles = parseFloat(formData.mileage) || 0;
    const extraMiles = Math.max(0, miles - 10);
    const surcharge = Math.round((extraMiles * 2) * 100) / 100;
    
    let stampRate = 5;
    if (formData.state === 'WV') stampRate = 10;

    let dueLater = 0;
    if (isI9) dueLater = 25;
    else if (!isInspection && !isLoan) dueLater = (formData.signatures || 0) * stampRate;
    
    return { 
        travelTotal: (base + surcharge).toFixed(2),
        surcharge: surcharge.toFixed(2),
        dueLater, 
        grandTotal: (base + surcharge + dueLater).toFixed(2),
        isOutofBounds: miles > 25
    };
  }, [formData.service, formData.mileage, formData.signatures, isI9, isInspection, isLoan, formData.state]);

  const timeSlots = useMemo(() => {
    if (!formData.date) return [];
    const dateObj = new Date(formData.date + 'T12:00:00');
    const day = dateObj.getDay(); 
    if (day === 0) return []; 
    if (isI9 || isInspection) {
        const slots = [];
        for (let i = 9; i <= 19; i++) {
            const hour = i > 12 ? i - 12 : i;
            const ampm = i >= 12 ? 'PM' : 'AM';
            slots.push(`${hour}:00 ${ampm}`);
        }
        return slots;
    }
    if (day === 6) return ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    else return ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
  }, [formData.date, isI9, isInspection]);

  const isStepValid = () => {
    if (step === 1) return formData.service && formData.date && formData.time;
    if (step === 2) {
        const basicFields = formData.name && formData.email && (isI9 || isInspection || isLoan || formData.signatures > 0);
        return basicFields && formData.street && formData.city && formData.zip && !isNaN(parseFloat(formData.mileage)) && !isCalculating;
    }
    if (step === 3) return termsAccepted && payNow;
    return false;
  };

  if (!isOpen) return null;

  const submitBooking = async () => {
    if (!isStepValid()) return; 
    setIsSubmitting(true);
    const finalPayload = { 
        ...formData, 
        address: `${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}`.trim()
    };
    
    try { localStorage.setItem('pendingBooking', JSON.stringify(finalPayload)); } catch (e) {}
    try { await safeFetch(`${API_URL}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalPayload) }); } catch(e) {}

    const endpoint = `${API_URL}/api/create-checkout-session`;
    try {
      const res = await safeFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalPayload) });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else { alert(data.error || "Submission failed."); }
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-brand-navy-dark/80 backdrop-blur-sm sm:p-4">
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="bg-white w-full md:max-w-2xl overflow-hidden flex flex-col h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl"
      >
        {success ? (
          <div className="p-12 md:p-20 text-center flex-1 flex flex-col justify-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-brand-navy-dark mb-4">Confirmed!</h3>
            <p className="text-gray-500 mb-10 text-lg">We've received your secure booking request.</p>
            <button onClick={onClose} className="bg-brand-navy-dark text-white px-10 py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform">Done</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <div className="flex flex-col">
                  <span className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-1">Step {step} of 3</span>
                  <h2 className="text-2xl font-bold font-serif text-brand-navy-dark leading-none">
                      {step === 1 ? 'Select Service' : step === 2 ? 'Location Details' : 'Review & Confirm'}
                  </h2>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"><X size={20} className="text-gray-600"/></button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 pb-32 md:pb-6">
                
              {/* Agentic Alerts */}
              {priorityAlert && step === 2 && (
                  <div className="bg-orange-50 border border-brand-gold p-4 rounded-xl mb-6 flex gap-3 items-start">
                      <AlertTriangle className="text-brand-orange shrink-0 mt-0.5" size={20}/>
                      <p className="text-sm font-medium text-brand-navy-dark">{priorityAlert}</p>
                  </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Mobile Notary Service', 'Field Inspection', 'I-9 Employment Verification', 'Loan Signing'].map(svc => (
                      <button 
                        key={svc} 
                        onClick={() => setFormData({...formData, service: svc})} 
                        className={`p-5 rounded-2xl text-left border-2 font-bold transition-all ${formData.service === svc ? 'border-brand-teal bg-teal-50/50 text-brand-navy-dark shadow-sm' : 'border-gray-100 text-gray-600 hover:border-gray-300'}`}
                      >
                        <span className="block text-base mb-1">{svc}</span>
                        <span className={`text-xs font-normal ${formData.service === svc ? 'text-brand-teal' : 'text-gray-400'}`}>
                            {svc.includes('Notary') ? 'Standard docs' : svc.includes('Field') ? 'Photo & verify' : svc.includes('I-9') ? 'Remote hires' : 'Real estate docs'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-gray-100">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Preferred Date</label>
                        <input type="date" className="p-4 bg-gray-50 border border-gray-200 rounded-xl w-full outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 text-brand-navy-dark font-bold text-lg min-h-[56px]" onChange={(e) => setFormData({...formData, date: e.target.value})} value={formData.date}/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Preferred Time</label>
                        <select className="p-4 bg-gray-50 border border-gray-200 rounded-xl w-full outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 text-brand-navy-dark font-bold text-lg min-h-[56px] appearance-none" onChange={(e) => setFormData({...formData, time: e.target.value})} value={formData.time} disabled={!formData.date || timeSlots.length === 0}>
                        <option value="">Select Time</option>
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                  </div>
                  
                  {(isI9 || isInspection) && (
                    <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start text-sm text-blue-900">
                        <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />
                        <div><strong>Flexible Hours Active:</strong> This specific service allows booking Monday-Saturday, 9AM to 7PM.</div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {/* Contact Block */}
                  <div className="space-y-4">
                      <h4 className="text-sm font-bold text-brand-navy-dark border-b pb-2">Client Information</h4>
                      <input type="text" placeholder={isInspection ? "Company / Contact Name" : "Full Legal Name"} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-base outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <input type="email" placeholder="Email Address for Receipt" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-base outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>

                  {/* Location Block */}
                  <div className="space-y-4 pt-4">
                      <h4 className="text-sm font-bold text-brand-navy-dark border-b pb-2 flex justify-between items-center">
                          Service Address
                          {isCalculating && <span className="text-xs font-medium text-brand-teal flex items-center gap-1 bg-brand-teal/10 px-2 py-1 rounded-full"><Loader2 size={12} className="animate-spin"/> Calculating Route...</span>}
                      </h4>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                              type="text" placeholder="Street Address (e.g. 123 Main St)" 
                              className="flex-[2] p-4 bg-gray-50 border border-gray-200 rounded-xl text-base outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10"
                              value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})}
                          />
                          <input 
                              type="text" placeholder="City" 
                              className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-base outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10"
                              value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
                          />
                      </div>
                      
                      <div className="flex gap-3">
                          <select 
                              className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-base font-bold outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 text-brand-navy-dark appearance-none"
                              value={formData.state} 
                              onChange={(e) => setFormData({...formData, state: e.target.value})}
                          >
                              <option value="WV">WV (West Virginia)</option>
                              <option value="OH">OH (Ohio)</option>
                              <option value="KY">KY (Kentucky)</option>
                          </select>
                          <input 
                              type="text" placeholder="Zip Code" maxLength="5"
                              className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-base outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10"
                              value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-center relative overflow-hidden">
                        {price.isOutofBounds && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg">OUT OF BOUNDS</div>}
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Travel Pricing</label>
                        <div className="text-sm font-semibold text-gray-600">
                            {isCalculating ? "Calculating your price..." : "Distance is auto-calculated in the final total."}
                        </div>
                    </div>
                    
                    {!isI9 && !isInspection && !isLoan && (
                        <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notary Stamps</label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" min="1" 
                                    className="w-24 p-3 bg-white border border-gray-200 rounded-xl text-center text-lg font-black text-brand-navy-dark outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10" 
                                    value={formData.signatures} onChange={(e) => setFormData({...formData, signatures: Math.max(1, parseInt(e.target.value) || 1)})} 
                                />
                                <span className="text-sm font-medium text-gray-600">(${(formData.state === 'WV') ? 10 : 5} each)</span>
                            </div>
                        </div>
                    )}
                  </div>

                  {price.isOutofBounds && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100">
                          You are located over 25 miles away. We require upfront travel payment to dispatch an agent this distance.
                      </div>
                  )}

                  <textarea placeholder={initialData?.prefillLocation ? "Specific instructions (Room number, contact details)..." : "Additional Notes (Gate code, specific instructions, etc)"} rows={3} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-base outline-none focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 resize-none mt-2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  {/* Digital Receipt Card */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="bg-slate-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-brand-navy-dark text-lg">Order Summary</span>
                        <Award className="text-brand-gold" size={24}/>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                            <div>
                                <p className="text-[11px] text-brand-teal uppercase font-black tracking-widest mb-1">Due Online Now</p>
                                <p className="text-4xl font-black text-brand-navy-dark">${price.travelTotal}</p>
                                <p className="text-sm font-medium text-gray-500 mt-1">{isInspection ? 'Base Service Fee' : 'Travel Reservation Fee'}</p>
                                {isCalculating && <p className="text-xs font-bold text-gray-500 mt-1">Calculating your price...</p>}
                                {!isCalculating && parseFloat(price.surcharge) > 0 && <p className="text-xs font-bold text-brand-orange mt-1">Includes ${price.surcharge} distance surcharge</p>}
                            </div>
                        </div>

                        {price.dueLater > 0 && (
                            <div className="flex justify-between items-center pt-2">
                                <div>
                                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest">Due at Appointment</p>
                                    <p className="text-sm font-medium text-gray-500">{isI9 ? 'Verification Fee' : `State Notary Fees (${formData.state})`}</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-400">${price.dueLater}</p>
                            </div>
                        )}
                        
                        <div className="bg-blue-50/50 p-4 rounded-2xl mt-4">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                <strong className="text-brand-navy-dark">Details:</strong> You are booking <strong>{formData.service}</strong> in <strong>{formData.state}</strong> at <strong>{formData.street}</strong> on <strong>{formData.date}</strong> at <strong>{formData.time}</strong>.
                            </p>
                        </div>
                    </div>
                  </div>
                  
                  {/* Mandatory Compliance */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-brand-teal/50 transition-colors">
                        <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 w-6 h-6 rounded accent-brand-teal shrink-0" />
                        <span className="text-sm text-gray-600 leading-relaxed font-medium">
                            {isI9 
                                ? "I understand this is an Authorized Representative service for I-9 verification and is NOT a notarization. A separate $25 service fee is due at the appointment." 
                                : isInspection 
                                ? "I understand this is a Field Inspection service and does not include document notarization. Base fee covers up to 10 miles of travel."
                                : `I understand state notarization fees ($${formData.state === 'WV' ? '10' : '5'} per act) are collected at the time of service. Travel fees are prepaid to ensure dispatch.`}
                        </span>
                    </label>

                    <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${payNow ? 'border-brand-teal bg-brand-teal/5 shadow-md' : 'border-gray-200 bg-white hover:border-brand-teal/50'}`}>
                        <input type="checkbox" checked={payNow} onChange={e => setPayNow(e.target.checked)} className="w-6 h-6 rounded accent-brand-teal shrink-0" />
                        <div className="flex-1">
                            <span className="font-black text-brand-navy-dark text-lg flex items-center gap-2"><CreditCard size={20} className={payNow ? 'text-brand-teal' : 'text-gray-400'}/> Secure Online Payment</span>
                            <p className="text-sm font-medium text-gray-500 mt-0.5">Proceed to Stripe Checkout</p>
                        </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer Action Area */}
            <div className="p-4 md:p-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
              <button onClick={() => setStep(s => s - 1)} className={`text-gray-400 font-bold px-6 py-3 hover:text-brand-navy-dark transition-colors ${step === 1 ? 'invisible' : ''}`}>Back</button>
              <button 
                onClick={() => step < 3 ? setStep(s => s + 1) : submitBooking()} 
                disabled={!isStepValid()} 
                className={`flex-1 md:flex-none md:px-12 py-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center gap-2 ${!isStepValid() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-navy-dark text-white hover:bg-brand-teal shadow-xl shadow-brand-navy-dark/20 active:scale-95'}`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? (payNow ? 'Checkout' : 'Confirm') : 'Continue'}
                {!isSubmitting && step < 3 && <ArrowRight size={20}/>}
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
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-brand-navy-dark">
    {/* Background Image & Overlay */}
    <div className="absolute inset-0 z-0">
      <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070" alt="Executive Notary Background" className="w-full h-full object-cover scale-105 opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/90 via-brand-navy-dark/80 to-brand-navy-dark"></div>
    </div>

    <div className="container mx-auto px-4 relative z-10 pt-32 md:pt-24 pb-16">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-5xl mx-auto text-center">
        
        {/* SEO Location Tag */}
        <div className="inline-flex items-center flex-wrap justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold uppercase tracking-widest mb-6 border border-brand-gold/20 backdrop-blur-sm">
            <MapPin size={14} className="shrink-0"/>
            <span>Huntington, WV • Proctorville, OH • Ashland, KY & Surrounding Areas</span>
        </div>
        
        {/* Main SEO Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white font-serif mb-6 leading-[1.1] tracking-tight">
          Trusted Field Inspections & <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-gold">Mobile Notary Services</span>
        </h1>
        
        {/* Service Tags */}
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 mb-8 text-brand-teal font-bold text-sm md:text-base">
            <span className="flex items-center gap-2"><FileSignature size={18}/> Mobile Notary</span>
            <span className="hidden md:inline text-gray-600">•</span>
            <span className="flex items-center gap-2"><Camera size={18}/> Field Inspections</span>
            <span className="hidden md:inline text-gray-600">•</span>
            <span className="flex items-center gap-2"><Car size={18}/> On-Site Service</span>
        </div>

        {/* AGENTIC INPUT */}
        <SmartHeroInput onBookClick={onBookClick} />

        <p className="text-lg md:text-xl text-white font-bold mb-10 mt-6">
          Need dependable local coverage? Let’s get it done right the first time.
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <a href={PHONE_LINK} className="bg-brand-gold text-brand-navy-dark font-black px-8 py-4 md:py-5 rounded-2xl hover:-translate-y-1 transition-transform shadow-xl shadow-brand-gold/20 text-base md:text-lg flex items-center justify-center gap-3">
            <PhoneCall size={22} /> Call for Immediate Dispatch
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

const TrustBar = () => (
    <div className="bg-white border-b border-gray-100 py-6 relative z-20">
        <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 md:gap-16 text-sm md:text-base text-brand-navy-dark font-bold">
                <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-teal" size={22}/> Commissioned Notary Public</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-teal" size={22}/> Fully E&O Insured</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-teal" size={22}/> Background Screened</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-teal" size={22}/> Tri-State Coverage</span>
            </div>
        </div>
    </div>
);

const WhyChooseUs = () => (
  <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
          <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-black text-brand-navy-dark mb-4">Speed. Accuracy. Compliance.</h2>
              <p className="text-lg text-gray-500 font-medium">Why top mortgage companies and private clients choose Signature Seal.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                  { icon: Zap, title: "Same-Day Service", desc: "Urgent requests accommodated with fast dispatch." },
                  { icon: Car, title: "100% Mobile", desc: "We travel directly to your home, office, or facility." },
                  { icon: Shield, title: "Compliance First", desc: "Strict adherence to WV, OH, and KY state laws." },
                  { icon: Clock, title: "Available Always", desc: "Evening and weekend appointments available." }
              ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                      <div className="bg-teal-50 text-brand-teal p-4 rounded-2xl mb-5"><item.icon size={32} /></div>
                      <h3 className="font-bold text-xl mb-2 text-brand-navy-dark">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
              ))}
          </div>
      </div>
  </section>
);

const Services = () => (
  <section id="services" className="py-24 bg-white relative border-t border-gray-100">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-navy-dark mb-4 tracking-tight">Core Services</h2>
            <p className="text-lg text-gray-500 font-medium">Professional on-site solutions for individuals and enterprise clients.</p>
          </div>
          <div className="hidden md:block">
              <a href={PHONE_LINK} className="text-brand-teal font-bold flex items-center gap-2 hover:text-brand-navy-dark transition-colors"><PhoneCall size={20}/> Need Help? Call Us</a>
          </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
        {[
          { icon: Camera, title: "Field Inspections", desc: "Occupancy verification, property condition reports, and photo documentation for asset managers." },
          { icon: Car, title: "Mobile Notary", desc: "General document notarization traveling directly to your location across the Tri-State area." },
          { icon: FileSignature, title: "Loan Signings", desc: "Accurate mortgage, real estate, and closing document execution for title companies." },
          { icon: Briefcase, title: "I-9 Verification", desc: "Acting as an Authorized Representative for secure, remote employee onboarding." }
        ].map((s, i) => (
          <div key={i} className="p-8 rounded-[2rem] bg-slate-50 border border-gray-100 hover:bg-brand-navy-dark hover:text-white group transition-colors duration-300">
            <div className="bg-white group-hover:bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-brand-teal group-hover:text-brand-gold transition-colors"><s.icon size={28}/></div>
            <h3 className="text-xl font-bold text-brand-navy-dark group-hover:text-white mb-3">{s.title}</h3>
            <p className="text-gray-500 group-hover:text-gray-300 text-sm leading-relaxed font-medium">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* SEO Targets: Documents & Locations */}
      <div id="coverage" className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-slate-50 p-8 md:p-12 rounded-[2.5rem] border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                  <div className="bg-brand-teal/10 p-3 rounded-xl text-brand-teal"><FileCheck size={28}/></div>
                  <h3 className="text-2xl font-serif font-bold text-brand-navy-dark">Common Documents</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  {['Power of Attorney (POA)', 'Wills & Estate Docs', 'Real Estate Documents', 'Affidavits', 'Medical Directives', 'Title Transfers', 'Mortgage Closings', 'Business Contracts'].map(doc => (
                      <li key={doc} className="flex items-center gap-3 text-gray-700 font-medium text-sm"><Check size={16} className="text-brand-gold shrink-0"/> {doc}</li>
                  ))}
              </ul>
          </div>

          <div className="bg-brand-navy-dark p-8 md:p-12 rounded-[2.5rem] text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                   <MapPin size={250} />
               </div>
               <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-8">
                       <div className="bg-brand-gold/20 p-3 rounded-xl text-brand-gold"><Building2 size={28}/></div>
                       <h3 className="text-2xl font-serif font-bold text-white">Where We Travel</h3>
                   </div>
                   <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed max-w-md">We provide discrete, professional service at specialized facilities requiring clearance, privacy, or sensitivity.</p>
                   <div className="space-y-4">
                       {[
                           "Hospitals & Medical Centers",
                           "Nursing & Assisted Living",
                           "Jails & Detention Centers",
                           "Corporate Offices",
                           "Private Residences & Cafes"
                       ].map((loc, idx) => (
                           <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                               <MapPin size={18} className="text-brand-teal"/>
                               <span className="font-bold text-gray-200 text-sm">{loc}</span>
                           </div>
                       ))}
                   </div>
               </div>
          </div>
      </div>

    </div>
  </section>
);

const Pricing = ({ onBookClick }) => (
  <section id="pricing" className="py-24 bg-slate-50 border-t border-gray-200">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
          <span className="text-brand-teal font-black tracking-widest uppercase text-xs mb-2 block">Transparent Upfront</span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-navy-dark mb-4 tracking-tight">Urgency Pricing</h2>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">We don't hide our fees. You pay for the travel reservation to guarantee your slot, and standard state fees at the table.</p>
      </div>
      
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-stretch">
        
        {/* Left Card: The Pricing Structure */}
        <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
              <div className="bg-brand-navy-dark text-brand-gold p-4 rounded-2xl"><Car size={32}/></div>
              <div>
                  <h3 className="text-2xl font-black text-brand-navy-dark">Mobile Service</h3>
                  <p className="text-gray-500 font-medium text-sm">Base reservation covers 10 miles.</p>
              </div>
          </div>

          <div className="flex-1 space-y-6 mb-10">
            <div className="flex items-start gap-4">
                <CheckCircle2 size={24} className="text-brand-teal shrink-0 mt-0.5"/> 
                <div>
                    <h4 className="font-bold text-brand-navy-dark text-lg">Travel Fee (Starting at $40)</h4>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">Secures your immediate dispatch. Extra miles beyond 10 are calculated at $2.00/mile.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <CheckCircle2 size={24} className="text-brand-teal shrink-0 mt-0.5"/> 
                <div>
                    <h4 className="font-bold text-brand-navy-dark text-lg">State Notary Fees</h4>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">Collected at appointment per state law. <br/><strong className="text-brand-navy-dark">WV:</strong> $10/stamp | <strong className="text-brand-navy-dark">OH/KY:</strong> $5/stamp</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <CheckCircle2 size={24} className="text-brand-teal shrink-0 mt-0.5"/> 
                <div>
                    <h4 className="font-bold text-brand-navy-dark text-lg">Field Inspections</h4>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">Flat base fee starting at $50 plus mileage. No stamps required.</p>
                </div>
            </div>
          </div>
          
          <button onClick={() => onBookClick()} className="w-full py-5 rounded-2xl bg-brand-navy-dark text-white font-black hover:bg-brand-teal transition-colors text-lg shadow-[0_10px_20px_rgba(29,45,62,0.2)] active:scale-95">
              Book Now to Calculate Exact Price
          </button>
        </div>
        
        {/* Right Side: The Value Prop */}
        <div className="p-8 md:p-12 flex flex-col justify-center h-full">
            <h3 className="text-3xl font-serif font-bold text-brand-navy-dark mb-6">Why Pre-Pay Online?</h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                When you need an inspection or notary immediately, reliability is everything. Pre-paying the reservation travel fee <strong className="text-brand-navy-dark">guarantees your appointment time</strong> and immediately dispatches an agent directly to your location without delay.
            </p>
            
            <div className="grid gap-4">
              {[
                { name: "Melissa R.", source: "Google Review", text: "Arrived on time, explained every step, and handled our hospital notarization professionally." },
                { name: "Jason T.", source: "Google Review", text: "Booking was easy, pricing was transparent, and communication was excellent from start to finish." },
                { name: "Avery K.", source: "Yelp Review", text: "Needed urgent I-9 verification and they got it done the same day with no confusion." }
              ].map((review, idx) => (
                <div key={idx} className="bg-brand-gold/10 border-l-4 border-brand-gold p-5 rounded-r-2xl">
                  <div className="flex text-brand-gold mb-2">
                    <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
                  </div>
                  <p className="text-sm text-brand-navy-dark font-medium italic leading-relaxed mb-2">"{review.text}"</p>
                  <p className="text-xs font-bold text-brand-navy-dark/60 uppercase tracking-wider">— {review.name} · {review.source}</p>
                </div>
              ))}
            </div>
        </div>

      </div>
    </div>
  </section>
);

const InstantResponse = ({ onBookClick }) => (
    <section className="bg-brand-navy-dark py-24 px-6 text-center text-white border-y-8 border-brand-gold relative overflow-hidden">
       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
       <div className="relative z-10">
           <h2 className="text-4xl md:text-6xl font-black font-serif mb-6 tracking-tight">Need Service Right Now?</h2>
           <p className="text-lg md:text-2xl mb-12 font-medium max-w-2xl mx-auto text-gray-300">Don't wait. We can dispatch an agent to your location immediately.</p>
           <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
               <a href={PHONE_LINK} className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-brand-gold text-brand-navy-dark px-12 py-5 rounded-2xl text-xl font-black hover:-translate-y-1 transition-transform shadow-xl shadow-brand-gold/20">
                  <PhoneCall size={24} /> Text or Call Now
               </a>
               <button onClick={onBookClick} className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-12 py-5 rounded-2xl text-xl font-bold hover:bg-brand-teal hover:border-brand-teal transition-all shadow-xl">
                  <Calendar size={24} /> Book Online 24/7
               </button>
           </div>
       </div>
    </section>
);

const Footer = ({ onViewChange }) => (
  <footer className="bg-white text-brand-navy-dark pt-20 pb-40 md:pb-24 border-t border-gray-200">
    <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16 text-center md:text-left">
            <div>
                <div className="inline-block p-4 bg-slate-50 rounded-2xl mb-6 shadow-sm border border-gray-100"><Award className="text-brand-navy-dark" size={32}/></div>
                <h2 className="font-serif text-3xl font-black mb-3">Signature Seal</h2>
                <p className="text-gray-500 font-medium max-w-sm">Professional, reliable, and legally compliant services delivered to your doorstep in the Tri-State area.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-6">
                <a href={PHONE_LINK} className="text-3xl font-black text-brand-navy-dark hover:text-brand-teal transition-colors flex items-center gap-3">
                    <div className="bg-brand-gold/20 p-2 rounded-lg text-brand-gold"><PhoneCall size={24}/></div>
                    {PHONE_NUMBER}
                </a>
                <div className="flex flex-wrap justify-center md:justify-end gap-6 text-gray-500 font-bold uppercase text-xs tracking-widest">
                  <button onClick={() => { onViewChange('home'); setTimeout(() => document.getElementById('services')?.scrollIntoView(), 100); }} className="hover:text-brand-teal">Services</button>
                  <button onClick={() => { onViewChange('home'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView(), 100); }} className="hover:text-brand-teal">Pricing</button>
                  <button onClick={() => { onViewChange('home'); setTimeout(() => document.getElementById('faq')?.scrollIntoView(), 100); }} className="hover:text-brand-teal">FAQ</button>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-brand-teal">Email Us</a>
                </div>
            </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 text-xs font-medium">© {new Date().getFullYear()} Signature Seal Notaries. Licensed & Insured (WV-OH-KY).</p>
            <button 
                onClick={() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); onViewChange('admin'); }} 
                className="text-xs text-gray-400 hover:text-brand-navy-dark font-bold flex items-center gap-1 transition-colors"
            >
                <Lock size={14}/> Admin Portal
            </button>
        </div>
    </div>
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
  
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm"><div className="w-16 h-16 bg-brand-navy-dark rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock size={24} className="text-brand-gold"/></div><h2 className="text-2xl font-black text-center mb-8 text-brand-navy-dark">Admin Access</h2><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl outline-none focus:border-brand-teal mb-4 font-bold text-center" placeholder="Enter Password"/><button className="w-full bg-brand-navy-dark text-white py-4 rounded-xl font-bold hover:bg-brand-teal transition-colors active:scale-95">Login</button></form></div>;
};

const AdminDashboard = ({ token, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminView, setAdminView] = useState('cards');
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
  const handleSendInvoice = async (id) => {
    const sigs = prompt("How many stamps/certificates or flat fee items?");
    if (!sigs || isNaN(sigs) || parseInt(sigs) < 1) return alert("Please enter a valid number.");
    try {
        const res = await fetch(`${API_URL}/api/create-invoice`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, signatures: sigs, type: 'notary' })
        });
        const data = await res.json();
        if (res.ok) alert("Invoice sent!");
        else alert("Failed: " + data.error);
    } catch (err) { alert("Error connecting."); }
  };
  const bookingsByDate = useMemo(() => bookings.reduce((acc, booking) => {
    const key = new Date(booking.date).toISOString().slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(booking);
    return acc;
  }, {}), [bookings]);
  return (
    <div className="container mx-auto px-6 py-32 min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6"><h2 className="text-3xl font-black text-brand-navy-dark">Admin Dashboard</h2><div className="flex gap-4"><button onClick={() => setAdminView(v => v === 'cards' ? 'calendar' : 'cards')} className="bg-white border border-gray-200 px-4 rounded-xl hover:bg-gray-50 text-sm font-bold">{adminView === 'cards' ? 'Calendar View' : 'Card View'}</button><button onClick={handleExport} className="bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50"><Download size={20}/></button><button onClick={onLogout} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-100"><LogOut size={20}/></button></div></div>
      {adminView === 'cards' ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{bookings.map(b => (
        <div key={b.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
            <button onClick={() => handleDelete(b.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
            <div className="text-xs font-bold text-brand-teal uppercase tracking-widest mb-2">{new Date(b.date).toLocaleDateString()}</div>
            <h3 className="font-black text-xl text-brand-navy-dark mb-1">{b.name}</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">{b.service}</p>
            <button onClick={() => handleSendInvoice(b.id)} className="w-full flex items-center justify-center gap-2 bg-brand-navy-dark text-brand-gold py-3 rounded-xl text-sm font-bold hover:bg-brand-teal hover:text-white transition-colors active:scale-95">
                <CreditCard size={16}/> Send Follow-Up Invoice
            </button>
        </div>
      ))}</div> : <div className="space-y-4">{Object.keys(bookingsByDate).sort().map((dateKey) => (
        <div key={dateKey} className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-black text-brand-navy-dark mb-3">{new Date(dateKey).toLocaleDateString()}</h3>
          <div className="space-y-2">
            {bookingsByDate[dateKey].map((b) => <div key={b.id} className="flex justify-between text-sm border-b border-gray-100 pb-2"><span>{b.time} — {b.name}</span><span className="text-gray-500">{b.service}</span></div>)}
          </div>
        </div>
      ))}</div>}
    </div>
  );
};

// --- APP ROOT ---

function App() {
  const [view, setView] = useState('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [adminToken, setAdminToken] = useState(() => {
    try { return localStorage.getItem('adminToken'); } catch (e) { return null; }
  });
  const [isQRModalOpen, setIsQRModalOpen] = useState(false); 
  const [restoredData, setRestoredData] = useState(null);

  // Updated to handle both direct service strings AND agentic objects
  const handleBookingOpen = (agenticData = null) => { 
      if (typeof agenticData === 'string') {
           setPreSelectedService(agenticData);
           setRestoredData(null);
      } else if (agenticData && typeof agenticData === 'object') {
           setPreSelectedService(agenticData.service || null);
           setRestoredData(agenticData); // Pass the whole object down
      } else {
           setPreSelectedService(null);
           setRestoredData(null);
      }
      setIsBookingOpen(true); 
  };
  
  const handleLogin = (token) => { localStorage.setItem('adminToken', token); setAdminToken(token); };
  const handleLogout = () => { localStorage.removeItem('adminToken'); setAdminToken(null); setView('home'); };

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

  useEffect(() => {
    const timer = setTimeout(() => {
        window.scrollTo(0, 0);
    }, 10);
    return () => clearTimeout(timer);
  }, [view]);

  return (
    <div className="font-sans min-h-screen bg-white">
      <StructuredData />
      <Navbar 
        onBookClick={() => handleBookingOpen()} 
        onViewChange={setView} 
        currentView={view} 
        onQRClick={() => setIsQRModalOpen(true)}
      />
      <main>
        {view === 'home' ? (
          <>
            <Hero onBookClick={handleBookingOpen} />
            <TrustBar />
            <WhyChooseUs />
            <Services />
            <Pricing onBookClick={(service) => handleBookingOpen(service)} />
            <FAQ />
            <InstantResponse onBookClick={() => handleBookingOpen()} />
            <AIChatWidget onRecommend={(data) => handleBookingOpen(data)} />
          </>
        ) : (!adminToken ? <LoginScreen onLogin={handleLogin} /> : <AdminDashboard token={adminToken} onLogout={handleLogout} />)}
      </main>
      <Footer onViewChange={setView} />
      <BookingModal isOpen={isBookingOpen} onClose={() => { setIsBookingOpen(false); setRestoredData(null); }} initialService={preSelectedService} initialData={restoredData} />
      <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} /> 
      
      {/* Mobile Sticky Bar - Zero Friction */}
      {!adminToken && !isBookingOpen && view === 'home' && <FloatingBookButton onClick={() => handleBookingOpen()} />}
    </div>
  );
}

export default App;
