import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, ChevronRight, Clock, Clock1, Clock2, Heart } from 'lucide-react';

interface ReadingHistory {
  id: string;
  date: string;
  handType: 'left' | 'right';
  modelId: string;
  reading: string;
  imageSrc: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecord: (record: ReadingHistory) => void;
  userEmail: string | null;
}

export default function HistoryModal({ isOpen, onClose, onSelectRecord, userEmail }: HistoryModalProps) {
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const storageKey = userEmail ? `palm_history_${userEmail}` : 'palm_history';

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setHistory(JSON.parse(saved));
      } else {
        setHistory([]);
      }
    }
  }, [isOpen, storageKey]);

  const clearHistory = () => {
    if (window.confirm("确定要清空命运档案吗？")) {
      localStorage.removeItem(storageKey);
      setHistory([]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="history-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-mystic-900 border border-gold-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-serif text-gold-400">个人命运档案</h2>
              <button
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {history.length === 0 ? (
                <div className="text-center text-white/50 py-10">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  时间长河中还没有留下你的印记。
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record, index) => {
                    const date = new Date(record.date);
                    return (
                      <motion.div
                        key={`history-record-${record.id}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          onSelectRecord(record);
                          onClose();
                        }}
                        className="bg-white/5 border border-white/10 hover:border-gold-500/50 rounded-xl p-4 flex gap-4 cursor-pointer transition-all hover:bg-white/10 group"
                      >
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10 relative flex items-center justify-center bg-white/5">
                           {record.imageSrc ? (
                             <>
                               <img src={record.imageSrc} alt="Palm" className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                             </>
                           ) : (
                             <div className="text-gold-500/50 flex flex-col items-center justify-center text-[10px]">
                               <Heart className="w-5 h-5 mb-1 animate-pulse" />
                               <span>命运线迹</span>
                             </div>
                           )}
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2 text-white/80">
                               <Calendar className="w-4 h-4 text-gold-500" />
                               <span className="text-sm">{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                           </div>
                           <h3 className="text-gold-400 font-medium mb-1">
                             {record.handType === 'left' ? '先天命格 (左手)' : '后天运势 (右手)'}
                           </h3>
                           <p className="text-sm text-white/50 line-clamp-1">{record.reading.replace(/#/g, '').substring(0, 50)}...</p>
                        </div>
                        <div className="flex items-center justify-center pl-2 text-white/30 group-hover:text-gold-400 transition-colors">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {history.length > 0 && (
               <div className="p-4 border-t border-white/10 text-center bg-black/20">
                  <button onClick={clearHistory} className="text-sm text-red-400/70 hover:text-red-400 transition-colors">
                     清空时空档案
                  </button>
               </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
