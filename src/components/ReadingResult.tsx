import React, { useState } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { Sparkles, RefreshCcw, Share2, Check, Heart, Brain, TrendingUp, Leaf, Moon, Star } from 'lucide-react';

interface ReadingResultProps {
  reading: string;
  onReset: () => void;
  onDeepDive: (focus: string) => void;
}

const FILTERS = ['全部', '整体能量', '生命线', '感情线', '智慧线', '事业线'];

export default function ReadingResult({ reading, onReset, onDeepDive }: ReadingResultProps) {
  const [activeFilter, setActiveFilter] = useState('全部');
  const [isCopied, setIsCopied] = useState(false);

  // Split reading by H2 headers (## ) to separate sections
  const sections = reading.split(/(?=##\s)/);

  const handleShare = async () => {
    // Clean up markdown characters for plain text sharing
    const plainText = reading.replace(/[*#]/g, '').trim();
    const shareText = `【神秘手相占卜】\n\n${plainText}\n\n✨ 命运掌握在自己手中，快来测测你的手相吧！`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的神秘手相解读',
          text: shareText,
        });
      } catch (err) {
        console.log('分享被取消或失败', err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('复制失败', err);
        alert('复制到剪贴板失败，请手动复制。');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-mystic-800/50 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className="w-6 h-6 text-gold-500" />
          <h2 className="text-3xl font-serif text-gold-400 text-center m-0">您的星象解读</h2>
          <Sparkles className="w-6 h-6 text-gold-500" />
        </div>
        
        {/* Filter Options */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-gold-500 text-mystic-900 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-mystic-900/50 text-gold-400/70 border border-gold-500/20 hover:border-gold-500/50 hover:text-gold-400'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="space-y-6">
          {sections.map((section, index) => {
            if (!section.trim()) return null;
            
            const isMatch = activeFilter !== '全部' && section.includes(activeFilter);
            const isDimmed = activeFilter !== '全部' && !isMatch;

            let Icon = Star;
            if (section.includes('生命')) Icon = Leaf;
            else if (section.includes('感情')) Icon = Heart;
            else if (section.includes('智慧')) Icon = Brain;
            else if (section.includes('事业')) Icon = TrendingUp;
            else if (section.includes('能量')) Icon = Sparkles;
            else if (section.includes('建议')) Icon = Moon;
            
            return (
              <motion.div 
                key={index}
                initial={false}
                animate={{ 
                  opacity: isDimmed ? 0.3 : 1,
                  scale: isMatch ? 1.02 : 1,
                }}
                className={`transition-all duration-500 rounded-xl flex gap-4 sm:gap-6 ${
                  isMatch ? 'bg-gold-500/10 border border-gold-500/30 p-5 shadow-[0_0_20px_rgba(212,175,55,0.1)] my-4' : 'p-2'
                }`}
              >
                <div className="shrink-0 flex flex-col items-center pt-1 sm:pt-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-mystic-900 border border-gold-500/40 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-gold-400" />
                  </div>
                  {isMatch && <div className="w-px h-full bg-gradient-to-b from-gold-500/50 to-transparent mt-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="markdown-body prose prose-invert max-w-none">
                    <Markdown
                      components={{
                        h2: ({node, children, ...props}) => (
                          <h2 {...props} style={{ marginTop: 0 }}>{children}</h2>
                        )
                      }}
                    >
                      {section}
                    </Markdown>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {activeFilter !== '全部' && activeFilter !== '整体能量' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={() => onDeepDive(activeFilter)}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gold-500 text-mystic-900 hover:bg-gold-400 transition-all duration-300 font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              深入探索{activeFilter}
            </button>
          </motion.div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-mystic-800/80 border border-gold-500/50 text-gold-400 hover:bg-gold-500/20 transition-all duration-300 font-medium"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {isCopied ? '已复制到剪贴板' : '分享解读结果'}
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gold-500/30 hover:border-gold-500 text-gold-400 hover:bg-gold-500/10 transition-all duration-300 font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            重新上传手相
          </button>
        </div>
      </div>
    </motion.div>
  );
}
