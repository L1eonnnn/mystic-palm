import React, { useRef, useState } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
}

export default function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
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
        onImageSelected(match[2], match[1]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
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
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                上传
              </button>
              
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.capture = 'environment';
                    fileInputRef.current.click();
                  }
                }}
                className="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-400 text-mystic-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                拍照
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
    </div>
  );
}
