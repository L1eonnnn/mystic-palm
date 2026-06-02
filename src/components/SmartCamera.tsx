import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartCameraProps {
  onCapture: (base64: string, mimeType: string) => void;
  onClose: () => void;
}

export default function SmartCamera({ onCapture, onClose }: SmartCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('无法访问相机，请确保已授予权限。');
      console.error('Camera access error:', err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const match = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.*)$/);
        if (match) {
           onCapture(dataUrl, match[1]); // Wait, the caller ImageUploader needs base64 and mime, actually I'll just pass dataUrl up and let it parse? No, let's keep consistency:
           // ImageUploader processFile does: `onImageSelected(match[2], match[1], selectedModel);`
           // Let's pass the dataURL directly or extract it here.
           // Actually, `onCapture` here can just pass back `base64` and `mimeType`.
           onCapture(match[2], match[1]);
        }
      }
    }
  }, [stream, onCapture]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent z-10 absolute top-0 left-0 right-0">
        <div className="text-gold-400 font-serif text-lg text-center flex-1">智能手相采集</div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors absolute right-4">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-red-400 text-center p-6 bg-mystic-900/80 rounded-xl">
            <p>{error}</p>
            <button onClick={startCamera} className="mt-4 px-4 py-2 bg-gold-600 text-white rounded-lg flex items-center justify-center mx-auto gap-2">
              <RefreshCcw className="w-4 h-4" />重试
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Guide Overlays */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Top guidance text */}
              <div className="absolute top-20 flex flex-col items-center gap-2">
                <span className="bg-black/60 text-gold-400 px-4 py-2 rounded-full text-sm backdrop-blur border border-gold-500/30 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" /> 光线充足
                </span>
                <span className="bg-black/60 text-gold-400 px-4 py-2 rounded-full text-sm backdrop-blur border border-gold-500/30 flex items-center gap-2">
                  <span className="w-4 h-4 border border-green-400 rounded-sm"></span> 手掌放平并居中
                </span>
              </div>

              {/* Hand Outline Guide */}
              <div className="relative w-64 h-80 border-2 border-dashed border-gold-500/70 rounded-[40px] animate-pulse flex items-center justify-center">
                 {/* Internal hand shape approximation or center target */}
                 <div className="w-32 h-32 border border-gold-500/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-gold-500/50 rounded-full" />
                 </div>
              </div>
              
              <div className="absolute bottom-32 text-white/80 text-sm bg-black/50 px-4 py-1 rounded-full backdrop-blur">
                请将手掌对准虚线框
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer controls */}
      <div className="h-32 bg-black flex items-center justify-center pb-8 pt-4 z-10">
        {!error && (
          <button
            onClick={takePhoto}
            className="w-20 h-20 bg-white/20 border-4 border-gold-500 rounded-full flex items-center justify-center hover:bg-white/30 transition-all active:scale-95 group"
          >
            <div className="w-16 h-16 bg-white rounded-full group-hover:scale-95 transition-all flex items-center justify-center">
                <Camera className="w-8 h-8 text-black" />
            </div>
          </button>
        )}
      </div>
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
