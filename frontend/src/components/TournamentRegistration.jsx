import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Ensure you've run: npm install framer-motion
import { useTheme, tokens } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { Mail, UserPlus, Send, CheckCircle, ArrowRight } from 'lucide-react';

export default function TournamentRegistrationPage() {
  const { dark } = useTheme();
  const t = tokens(dark);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-['Barlow_Condensed']" style={{ background: t.bg }}>
      
      {/* BACKGROUND IMAGE WITH RED/GREY OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070" 
          className="w-full h-full object-cover opacity-20 grayscale" 
          alt="background"
        />
        {/* Color Gradient Overlay: Light Red to Greyish Dark */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: `radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, ${t.bg} 80%)` 
          }}
        />
      </div>

      <Navbar alwaysVisible={true} />

      <main className="relative z-10 max-w-4xl mx-auto pt-32 pb-20 px-6">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div 
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center">
                <motion.h1 variants={itemVariants} className="text-6xl font-black uppercase italic tracking-tighter italic">
                  Launch Your <span className="text-red-500">Legacy</span>
                </motion.h1>
                <motion.p variants={itemVariants} className="text-xl opacity-60 uppercase tracking-widest">Step 1: Identity Creation</motion.p>
              </div>

              <div className="p-10 rounded-3xl border border-white/10 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-bold text-red-400 uppercase tracking-widest ml-2">Team Identity</label>
                    <input 
                      placeholder="TEAM NAME (E.G. GODLIKE)" 
                      className="w-full p-5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-2xl font-black italic uppercase" 
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-bold text-red-400 uppercase tracking-widest ml-2">Abbreviation</label>
                    <input 
                      placeholder="TAG" 
                      maxLength={5}
                      className="w-full p-5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-2xl font-black italic uppercase text-center" 
                      style={{ background: 'rgba(255,255,255,0.05)', color: t.accent }}
                    />
                  </motion.div>
                </div>
                <motion.button 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)} 
                  className="w-full py-5 rounded-2xl font-black uppercase text-xl tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(239,68,68,0.3)]" 
                  style={{ background: t.accent, color: '#fff' }}
                >
                  Confirm Team Details <ArrowRight size={24} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">Mobilize Your <span className="text-red-500">Unit</span></h2>
                <p className="opacity-60 uppercase tracking-widest">We generate registration links for your comrades</p>
              </div>

              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div 
                    key={i}
                    variants={itemVariants}
                    className="group p-1 rounded-2xl transition-all hover:bg-gradient-to-r from-red-500/50 to-transparent"
                  >
                    <div className="p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center" style={{ background: t.surface }}>
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold shrink-0">
                        {i === 4 ? 'E' : i + 1}
                      </div>
                      <input 
                        placeholder="PLAYER NAME" 
                        className="bg-transparent border-b border-white/10 outline-none p-2 w-full font-bold uppercase"
                      />
                      <input 
                        type="email"
                        placeholder="PLAYER EMAIL" 
                        className="bg-transparent border-b border-white/10 outline-none p-2 w-full font-bold uppercase text-red-400"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: '0 20px 50px rgba(239,68,68,0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setIsSubmitting(true); setTimeout(() => setStep(3), 2000); }}
                className="w-full py-6 rounded-2xl font-black uppercase text-2xl tracking-[0.3em] flex items-center justify-center gap-4 relative overflow-hidden" 
                style={{ background: t.accent, color: '#fff' }}
              >
                {isSubmitting ? "Generating System Links..." : (
                  <>Deploy Invitations <Send size={24} /></>
                )}
              </motion.button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20"
            >
              <div className="relative inline-block mb-8">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1.5, opacity: 0 }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full bg-red-500"
                />
                <CheckCircle size={100} className="text-red-500 relative z-10" />
              </div>
              <h2 className="text-6xl font-black uppercase italic mb-4">Deployment <span className="text-white">Active</span></h2>
              <p className="text-xl opacity-60 max-w-lg mx-auto mb-10">
                System links have been dispatched. Your team will appear in the Arena as soon as they register.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-12 py-4 rounded-full border-2 border-red-500 font-black uppercase tracking-widest hover:bg-red-500 transition-colors"
              >
                Return to Command Center
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}