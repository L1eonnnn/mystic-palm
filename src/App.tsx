import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, Star, MessageSquare, LogIn } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import ReadingResult from './components/ReadingResult';
import FeedbackModal from './components/FeedbackModal';
import MysticLoading from './components/MysticLoading';
import { analyzePalm } from './services/geminiService';

import HistoryModal from './components/HistoryModal';
import LoginModal from './components/LoginModal';
import UpgradePage from './components/UpgradePage';

export default function App() {
  const [appState, setAppState] = useState<'idle' | 'loading' | 'result'>('idle');
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradePageOpen, setIsUpgradePageOpen] = useState(false);
  const [isPlusSubscribed, setIsPlusSubscribed] = useState<boolean>(() => localStorage.getItem('isPlusSubscribed') === 'true');
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('currentUserEmail'));
  const [currentImage, setCurrentImage] = useState<{base64: string, mimeType: string} | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.5-flash');
  const [selectedHandType, setSelectedHandType] = useState<string>('left');

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('currentUserEmail', email);
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem('currentUserEmail');
  };

  const handleImageSelected = async (base64: string, mimeType: string, modelId: string, handType: string) => {
    setCurrentImage({ base64, mimeType });
    setSelectedModelId(modelId);
    setSelectedHandType(handType);
    setAppState('loading');
    setError(null);
    try {
      const result = await analyzePalm(base64, mimeType, '全部', modelId, handType);
      setReading(result);
      setAppState('result');
      
      // Save to history (dependent on current login status)
      const historyItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        handType,
        modelId,
        reading: result,
        imageSrc: `data:${mimeType};base64,${base64}`
      };
      const storageKey = userEmail ? `palm_history_${userEmail}` : 'palm_history';
      const existingHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([historyItem, ...existingHistory]));
    } catch (err: any) {
      setError(err.message || "宇宙连接中断，请重试。");
      setAppState('idle');
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setReading(null);
    setError(null);
    setCurrentImage(null);
  };

  const handleDeepDive = async (focus: string) => {
    if (!currentImage) return;
    setAppState('loading');
    setError(null);
    try {
      const result = await analyzePalm(currentImage.base64, currentImage.mimeType, focus, selectedModelId, selectedHandType);
      setReading(result);
      setAppState('result');
    } catch (err: any) {
      setError(err.message || "宇宙连接中断，请重试。");
      setAppState('idle');
    }
  };

  const handleSelectHistoryRecord = (record: any) => {
    // Extract base64 and mime
    const match = record.imageSrc.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.*)$/);
    if (match) {
        setCurrentImage({ base64: match[2], mimeType: match[1] });
    }
    setReading(record.reading);
    setSelectedHandType(record.handType);
    setSelectedModelId(record.modelId);
    setAppState('result');
  };

  return (
    <div className="min-h-screen bg-mystic-900 text-gold-400 font-sans relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-mystic-800 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-mystic-700 rounded-full mix-blend-screen filter blur-[80px] opacity-60" />
        <div className="absolute top-[40%] right-[30%] w-64 h-64 bg-gold-500/10 rounded-full mix-blend-screen filter blur-[60px] opacity-40" />
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        {isPlusSubscribed ? (
          <button
            onClick={() => setIsUpgradePageOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border border-indigo-400 text-white rounded-full text-xs font-bold transition-all shadow-lg backdrop-blur flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-current animate-spin" />
            <span>Plus 尊享版</span>
          </button>
        ) : (
          <button
            onClick={() => setIsUpgradePageOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500/25 to-yellow-600/15 hover:from-amber-500/35 hover:to-yellow-600/30 border border-amber-500/40 text-gold-400 rounded-full text-xs font-bold transition-all shadow-lg backdrop-blur flex items-center gap-1.5 cursor-pointer"
          >
            <span>👑 升级 Plus ($6.9)</span>
          </button>
        )}

        {userEmail ? (
          <div className="flex items-center gap-2 bg-black/40 p-1.5 pl-3 pr-2 border border-gold-500/30 rounded-full text-xs font-medium backdrop-blur shadow-lg">
            <span className="text-gold-200">{userEmail.length > 15 ? `${userEmail.substring(0, 12)}...` : userEmail}</span>
            <button
              onClick={handleLogout}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-full transition-colors text-[10px] uppercase font-bold cursor-pointer hover:text-white"
            >
              退出
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-gold-500/25 to-gold-400/10 hover:from-gold-500/45 border border-gold-500/40 hover:border-gold-500 rounded-full text-sm font-medium transition-all shadow-lg backdrop-blur text-white flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-gold-400" />
            <span>启示登录</span>
          </button>
        )}
        
        <button 
          onClick={() => {
            if (!userEmail) {
              setIsLoginModalOpen(true);
            } else {
              setIsHistoryModalOpen(true);
            }
          }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-gold-500/30 rounded-full text-sm font-medium transition-colors shadow-lg backdrop-blur text-white cursor-pointer"
        >
          我的档案
        </button>
      </div>

      <header className="z-10 text-center mb-12 mt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <Moon className="w-8 h-8 text-gold-500" />
          <h1 className="text-4xl sm:text-5xl font-serif font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 drop-shadow-sm">
            神秘手相占卜
          </h1>
          <Star className="w-6 h-6 text-gold-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg text-white/70 max-w-xl mx-auto font-light"
        >
          揭开你手掌纹路中隐藏的秘密，让古老的智慧指引你的前程。
        </motion.p>
      </header>

      <main className="z-10 w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {appState === 'idle' && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <ImageUploader 
                onImageSelected={handleImageSelected} 
                isPlusSubscribed={isPlusSubscribed}
                onOpenUpgrade={() => setIsUpgradePageOpen(true)}
              />
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-200 text-center max-w-md mx-auto"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {appState === 'loading' && (
            <MysticLoading key="loading" />
          )}

          {appState === 'result' && reading && currentImage && (
            <ReadingResult 
              key="result" 
              reading={reading} 
              handType={selectedHandType as 'left' | 'right'}
              imageSrc={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
              onReset={handleReset} 
              onDeepDive={handleDeepDive} 
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="z-10 mt-16 pb-8 text-center text-white/40 text-sm flex flex-col items-center gap-4">
        <p>仅供娱乐。星辰指引方向，但命运由你掌握。</p>
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-gold-500/50 hover:text-gold-400 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          提供反馈
        </button>
      </footer>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectRecord={handleSelectHistoryRecord}
        userEmail={userEmail}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <UpgradePage
        isOpen={isUpgradePageOpen}
        onClose={() => setIsUpgradePageOpen(false)}
        isUnlocked={isPlusSubscribed}
        onUpgradeSuccess={() => {
          setIsPlusSubscribed(true);
          localStorage.setItem('isPlusSubscribed', 'true');
        }}
      />
    </div>
  );
}
