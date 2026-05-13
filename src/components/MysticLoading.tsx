import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function MysticLoading() {
  // Generate random particles for the starfield effect
  const particles = Array.from({ length: 35 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 140 + 30; // Spread between 30 and 170
    return {
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20 relative w-full overflow-hidden"
    >
      {/* Particle Field */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
            style={{ width: p.size, height: p.size }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Central Astrolabe / Magic Circle */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer glowing ring */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 20, ease: "linear" },
            scale: { repeat: Infinity, duration: 4, ease: "easeInOut" }
          }}
          className="absolute inset-0 border border-gold-500/30 rounded-full shadow-[0_0_30px_rgba(212,175,55,0.15)]"
          style={{ borderTopColor: 'rgba(212, 175, 55, 0.8)', borderBottomColor: 'rgba(212, 175, 55, 0.8)' }}
        />
        
        {/* Middle dashed ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="absolute inset-4 border-2 border-dashed border-gold-400/40 rounded-full"
        />

        {/* Inner dotted ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="absolute inset-8 border-[3px] border-dotted border-gold-500/50 rounded-full"
        />
        
        {/* Core Glow */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute inset-12 bg-gradient-to-tr from-gold-500/40 to-mystic-800/40 rounded-full blur-xl"
        />
        
        {/* Center Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="relative z-10"
        >
          <Sparkles className="w-14 h-14 text-gold-400 drop-shadow-[0_0_15px_rgba(212,175,55,1)]" />
        </motion.div>
      </div>

      {/* Loading Text */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="mt-16 flex flex-col items-center z-10"
      >
        <p className="text-2xl font-serif text-gold-400 tracking-widest drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]">
          正在请示宇宙能量
        </p>
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2, ease: "easeInOut" }}
              className="w-2 h-2 bg-gold-400 rounded-full shadow-[0_0_5px_rgba(212,175,55,0.8)]"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
