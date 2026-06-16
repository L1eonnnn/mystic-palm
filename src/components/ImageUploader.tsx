import React, { useRef, useState } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SmartCamera from './SmartCamera';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string, modelId: string, handType: string) => void;
  isPlusSubscribed: boolean;
  onOpenUpgrade: () => void;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

export default function ImageUploader({ onImageSelected, isPlusSubscribed, onOpenUpgrade, isLoggedIn, onOpenLogin }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash:free');
  const [customModelId, setCustomModelId] = useState('google/gemini-1.5-pro:free');
  const [handType, setHandType] = useState('left');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件。');
      return;
    }

      const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      // Extract base64 data and mime type
      const match = result.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.*)$/);
      if (match) {
        onImageSelected(match[2], match[1], selectedModel, handType);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSelectAlbum = () => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleOpenCamera = () => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    setIsCameraOpen(true);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gold-400 opacity-80 mb-2">选择模型</label>
          <div className="relative">
            <select 
              value={selectedModel}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== 'google/gemini-2.5-flash:free' && !isPlusSubscribed) {
                  onOpenUpgrade();
                  return;
                }
                setSelectedModel(val);
              }}
              className="w-full appearance-none bg-mystic-800/80 border border-gold-500/30 text-white font-medium py-2.5 pl-2.5 pr-7 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-gold-500/80 transition-components cursor-pointer"
            >
              <option value="google/gemini-2.5-flash:free">🆓 Gemini 2.5 Flash (免费/识图)</option>
              <option value="google/gemini-3-pro-image">{isPlusSubscribed ? '👑 Gemini 3 Pro 专业/识图' : '🔮 Gemini 3 Pro (Plus会员/识图)'}</option>
              <option value="openai/gpt-5.5">{isPlusSubscribed ? '👑 GPT-5.5 超级智能/识图' : '🔮 GPT-5.5 (Plus会员/识图)'}</option>
              <option value="qwen/qwen3.7-plus">{isPlusSubscribed ? '👑 千问 Qwen 3.7 Plus 专业识图' : '🔮 千问 Qwen 3.7 Plus (Plus会员/识图)'}</option>
              <option value="x-ai/grok-4.2-fast">{isPlusSubscribed ? '👑 Grok 4.2 Fast 极致解构' : '🔮 Grok 4.2 Fast (Plus会员/识图)'}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gold-500">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gold-400 opacity-80 mb-2">手部类型</label>
          <div className="relative">
            <select 
              value={handType}
              onChange={(e) => setHandType(e.target.value)}
              className="w-full appearance-none bg-mystic-800/80 border border-gold-500/30 text-white font-medium py-2.5 pl-2.5 pr-7 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-gold-500/80 transition-components cursor-pointer"
            >
              <option value="left">左手 (先天命格)</option>
              <option value="right">右手 (后天运势)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gold-500">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>
      </div>


      {!preview ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-gold-500 bg-mystic-800/50 scale-[1.02]'
              : 'border-white/20 bg-mystic-800/30 hover:bg-mystic-800/50 hover:border-gold-500/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-mystic-700 flex items-center justify-center mb-4 shadow-lg shadow-black/20">
              <Upload className="w-8 h-8 text-gold-400" />
            </div>
            <h3 className="text-xl font-serif text-gold-400 mb-2">献上您的手相</h3>
            <p className="text-sm text-white/60 mb-6">
              将图片拖拽至此，或点击浏览
            </p>
            
            <div className="flex gap-4 w-full">
              <button
                onClick={handleSelectAlbum}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                相册
              </button>
              
              <button
                onClick={handleOpenCamera}
                className="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-400 text-mystic-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                智能拍照
              </button>
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
        >
          <img
            src={preview}
            alt="Palm preview"
            className="w-full h-auto max-h-[400px] object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-mystic-900/80 to-transparent pointer-events-none" />
          
          <button
            onClick={clearImage}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <p className="text-gold-400 font-serif italic text-lg shadow-black drop-shadow-md">
              灵体已准备好解读...
            </p>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isCameraOpen && (
          <SmartCamera 
            onClose={() => setIsCameraOpen(false)}
            onCapture={(base64, mimeType) => {
              setPreview(`data:${mimeType};base64,${base64}`);
              setIsCameraOpen(false);
              onImageSelected(base64, mimeType, selectedModel, handType);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
