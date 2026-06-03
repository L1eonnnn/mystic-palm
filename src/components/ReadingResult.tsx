import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { Sparkles, RefreshCcw, Share2, Check, Heart, Brain, TrendingUp, Leaf, Moon, Star, ImageDown } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReadingResultProps {
  reading: string;
  handType?: 'left' | 'right';
  imageSrc?: string;
  onReset: () => void;
  onDeepDive: (focus: string) => void;
}

const FILTERS = ['全部', '整体能量', '生命线', '感情线', '智慧线', '事业线', '婚姻线', '总结启示'];

// Utility to convert an array of points into a smooth bezier curve string
const createSmoothCurve = (points: {x: number, y: number}[]) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

// Anatomical Fallback Points for Left and Right Palms
const getFallbackLinesState = (type: 'left' | 'right') => {
  if (type === 'left') {
    return {
      lines: [
        {
          name: "生命线",
          color: "#10b981",
          points: [
            { x: 28, y: 48 },
            { x: 35, y: 46 },
            { x: 43, y: 50 },
            { x: 48, y: 57 },
            { x: 48, y: 67 },
            { x: 43, y: 78 },
            { x: 34, y: 85 },
            { x: 25, y: 88 }
          ]
        },
        {
          name: "智慧线",
          color: "#0ea5e9",
          points: [
            { x: 28, y: 48 },
            { x: 38, y: 50 },
            { x: 48, y: 52 },
            { x: 58, y: 56 },
            { x: 68, y: 62 },
            { x: 75, y: 68 }
          ]
        },
        {
          name: "感情线",
          color: "#f43f5e",
          points: [
            { x: 78, y: 44 },
            { x: 68, y: 41 },
            { x: 56, y: 39 },
            { x: 44, y: 37 },
            { x: 34, y: 34 },
            { x: 26, y: 28 }
          ]
        },
        {
          name: "事业线",
          color: "#eab308",
          points: [
            { x: 48, y: 88 },
            { x: 48, y: 74 },
            { x: 48, y: 60 },
            { x: 48, y: 48 },
            { x: 48, y: 36 }
          ]
        },
        {
          name: "婚姻线",
          color: "#a855f7",
          points: [
            { x: 80, y: 36 },
            { x: 74, y: 36 },
            { x: 68, y: 36 }
          ]
        }
      ]
    };
  } else {
    // Right hand (mirrored)
    return {
      lines: [
        {
          name: "生命线",
          color: "#10b981",
          points: [
            { x: 72, y: 48 },
            { x: 65, y: 46 },
            { x: 57, y: 50 },
            { x: 52, y: 57 },
            { x: 52, y: 67 },
            { x: 57, y: 78 },
            { x: 66, y: 85 },
            { x: 75, y: 88 }
          ]
        },
        {
          name: "智慧线",
          color: "#0ea5e9",
          points: [
            { x: 72, y: 48 },
            { x: 62, y: 50 },
            { x: 52, y: 52 },
            { x: 42, y: 56 },
            { x: 32, y: 62 },
            { x: 25, y: 68 }
          ]
        },
        {
          name: "感情线",
          color: "#f43f5e",
          points: [
            { x: 22, y: 44 },
            { x: 32, y: 41 },
            { x: 44, y: 39 },
            { x: 56, y: 37 },
            { x: 66, y: 34 },
            { x: 74, y: 28 }
          ]
        },
        {
          name: "事业线",
          color: "#eab308",
          points: [
            { x: 52, y: 88 },
            { x: 52, y: 74 },
            { x: 52, y: 60 },
            { x: 52, y: 48 },
            { x: 52, y: 36 }
          ]
        },
        {
          name: "婚姻线",
          color: "#a855f7",
          points: [
            { x: 20, y: 36 },
            { x: 26, y: 36 },
            { x: 32, y: 36 }
          ]
        }
      ]
    };
  }
};

export default function ReadingResult({ reading, handType, imageSrc, onReset, onDeepDive }: ReadingResultProps) {
  const [activeFilter, setActiveFilter] = useState('全部');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [customLines, setCustomLines] = useState<any[] | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{lineIndex: number, pointIndex: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract JSON configuration generated by Gemini for palm lines
  const { cleanReading, finalLines } = React.useMemo(() => {
    let clean = reading;
    let data = null;
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = reading.match(jsonRegex);
    if (match) {
      try {
        data = JSON.parse(match[1]);
        clean = reading.replace(jsonRegex, '').trim();
      } catch (err) {
        console.error("Failed to parse line coordinates", err);
      }
    }
    
    // Build fallback and merge with parsed data to ensure absolute robustness and high custom fidelity
    const fallback = getFallbackLinesState(handType || 'left');
    let merged = [];
    
    if (data && data.lines && data.lines.length > 0) {
      const parsedLinesMap = new Map();
      data.lines.forEach((line: any) => {
        if (line.name && line.points && line.points.length >= 2) {
          // Normalize line naming to avoid matching misses
          let normalizedName = line.name.trim();
          if (normalizedName.includes("生命")) normalizedName = "生命线";
          else if (normalizedName.includes("智慧")) normalizedName = "智慧线";
          else if (normalizedName.includes("感情")) normalizedName = "感情线";
          else if (normalizedName.includes("事业")) normalizedName = "事业线";
          else if (normalizedName.includes("婚姻")) normalizedName = "婚姻线";
          parsedLinesMap.set(normalizedName, {
            ...line,
            name: normalizedName
          });
        }
      });
      
      merged = fallback.lines.map(fbLine => {
        if (parsedLinesMap.has(fbLine.name)) {
          return parsedLinesMap.get(fbLine.name);
        }
        return fbLine;
      });
    } else {
      merged = fallback.lines;
    }
    
    return { cleanReading: clean, finalLines: merged };
  }, [reading, handType]);

  // Sync with Gemini parsed lines / fallbacks when they change
  React.useEffect(() => {
    if (finalLines && finalLines.length > 0) {
      setCustomLines(finalLines);
    }
  }, [finalLines]);

  const updatePointPosition = React.useCallback((clientX: number, clientY: number) => {
    if (draggingPoint === null || !containerRef.current || !customLines) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate percentages (0-100) constrained within bounds
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, parseFloat(x.toFixed(1))));
    y = Math.max(0, Math.min(100, parseFloat(y.toFixed(1))));

    const updated = customLines.map((line: any, lIdx: number) => {
      if (lIdx !== draggingPoint.lineIndex) return line;
      return {
        ...line,
        points: line.points.map((pt: any, pIdx: number) => 
          pIdx === draggingPoint.pointIndex ? { x, y } : pt
        )
      };
    });
    setCustomLines(updated);
  }, [draggingPoint, customLines]);

  const handleMouseDownOrTouchStart = (lineIndex: number, pointIndex: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDraggingPoint({ lineIndex, pointIndex });
  };

  React.useEffect(() => {
    if (draggingPoint !== null) {
      const moveHandler = (e: MouseEvent) => {
        updatePointPosition(e.clientX, e.clientY);
      };
      const touchMoveHandler = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          updatePointPosition(e.touches[0].clientX, e.touches[0].clientY);
        }
      };
      const upHandler = () => {
        setDraggingPoint(null);
      };

      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('touchmove', touchMoveHandler, { passive: false });
      window.addEventListener('mouseup', upHandler);
      window.addEventListener('touchend', upHandler);

      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('touchmove', touchMoveHandler);
        window.removeEventListener('mouseup', upHandler);
        window.removeEventListener('touchend', upHandler);
      };
    }
  }, [draggingPoint, updatePointPosition]);

  const handleResetAlignment = () => {
    const fallback = getFallbackLinesState(handType || 'left');
    setCustomLines(fallback.lines);
  };

  const displayLines = customLines || finalLines;

  // Split reading by H2 headers (## ) to separate sections
  const sections = cleanReading.split(/(?=##\s)/);

  const handleShare = async () => {
    // Clean up markdown characters for plain text sharing
    const plainText = cleanReading.replace(/[*#]/g, '').trim();
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

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    try {
      setIsDownloading(true);
      // Ensure all styles are loaded before capturing, small delay
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0F0C29', // Fallback color mystic-900 like
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `手相占卜报告_${new Date().getTime()}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("生成长图失败", err);
      alert("生成图片失败，请重试");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto flex flex-col items-center"
    >
      <div 
        ref={reportRef} 
        className="glass-panel p-8 md:p-12 relative overflow-hidden w-full bg-gradient-to-b from-mystic-900 to-[#1A1635]"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-mystic-800/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-3">
             <Sparkles className="w-6 h-6 text-gold-500" />
             <h2 className="text-3xl font-serif text-gold-400 text-center m-0 shadow-black drop-shadow-lg">星辰罗盘 · 专属运势报告</h2>
             <Sparkles className="w-6 h-6 text-gold-500" />
          </div>
          <p className="text-white/40 text-sm font-serif">命运的轨迹，镌刻在掌心的每一道纹理中</p>
        </div>
        
        {/* Palm Image with Line Overlay */}
        {displayLines && displayLines.length > 0 && imageSrc && (
          <div className="w-full max-w-sm mx-auto mb-10">
            <motion.div 
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-full rounded-2xl overflow-hidden border border-gold-500/30 shadow-[0_0_20px_rgba(212,175,55,0.2)] group select-none touch-none"
            >
              <img 
                src={imageSrc} 
                alt="Your Palm overlay" 
                className={`w-full h-auto object-cover transition-all duration-700 ${
                  isCalibrating ? 'opacity-90 saturate-[0.85]' : 'opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100'
                }`} 
              />
              <div className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
                isCalibrating ? 'bg-mystic-950/50' : 'bg-mystic-900/40 group-hover:bg-mystic-900/10'
              }`} />
              
              <svg 
                className={`absolute inset-0 w-full h-full drop-shadow-md select-none ${
                  isCalibrating ? 'pointer-events-auto bg-black/10' : 'pointer-events-none'
                }`} 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                {displayLines.map((line: any, i: number) => {
                   if (!line.points || line.points.length < 2) return null;
                   // Filter out this line if it's not active in deep dive/filters
                   const isVisible = activeFilter === '全部' || activeFilter === line.name;
                   if (!isVisible) return null;

                   const pathD = createSmoothCurve(line.points);
                   const textPoint = line.points[Math.floor(line.points.length / 2)]; // Place text near middle
                   
                   return (
                     <g key={`line-group-${line.name || i}-${i}`}>
                       {/* Glow effect */}
                       <motion.path 
                         initial={{ pathLength: 0, opacity: 0 }} 
                         animate={{ pathLength: 1, opacity: 0.4 }} 
                         transition={{ duration: 2.5, delay: i * 0.5 + 0.2, ease: "easeInOut" }}
                         d={pathD} fill="none" stroke={line.color} strokeWidth={isCalibrating ? "2" : "3"} strokeLinecap="round" strokeLinejoin="round" 
                         style={{ filter: 'blur(3px)' }}
                       />
                       {/* Core line */}
                       <motion.path 
                         initial={{ pathLength: 0 }} 
                         animate={{ pathLength: 1 }} 
                         transition={{ duration: 2.5, delay: i * 0.5, ease: "easeInOut" }}
                         d={pathD} fill="none" stroke={line.color} strokeWidth={isCalibrating ? "1.6" : "1.2"} strokeLinecap="round" strokeLinejoin="round" 
                       />
                       {/* End points */}
                       <motion.circle initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 + 2.5 }} cx={line.points[0].x} cy={line.points[0].y} r="1" fill={line.color} />
                       <motion.circle initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 + 2.5 }} cx={line.points[line.points.length-1].x} cy={line.points[line.points.length-1].y} r="1" fill={line.color} />
                       
                       {/* Label overlaying on midway point */}
                       <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 + 2 }}>
                         <rect x={textPoint.x - 2} y={textPoint.y - 4.5} width="16" height="5" fill="rgba(15, 12, 41, 0.7)" rx="1" />
                         <text x={textPoint.x} y={textPoint.y - 1} fill={line.color} fontSize="3" fontWeight="bold" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.9)" }}>{line.name}</text>
                       </motion.g>

                       {/* Interactive drag handlers for manual alignment calibration */}
                       {isCalibrating && line.points.map((pt: any, idx: number) => {
                         const isDragging = draggingPoint?.lineIndex === i && draggingPoint?.pointIndex === idx;
                         return (
                           <g key={`point-handle-${line.name || i}-${i}-${idx}`} className="cursor-pointer pointer-events-auto">
                             {/* Fat-finger click/touch helper hitbox */}
                             <circle
                               cx={pt.x}
                               cy={pt.y}
                               r="4.5"
                               fill="transparent"
                               className="cursor-pointer"
                               onMouseDown={(e) => handleMouseDownOrTouchStart(i, idx, e)}
                               onTouchStart={(e) => handleMouseDownOrTouchStart(i, idx, e)}
                             />
                             {/* active pulsing glow circle */}
                             {isDragging && (
                               <circle
                                 cx={pt.x}
                                 cy={pt.y}
                                 r="3.5"
                                 fill="none"
                                 stroke={line.color}
                                 strokeWidth="0.5"
                                 className="animate-ping opacity-60"
                               />
                             )}
                             {/* solid anchor circle center */}
                             <circle
                               cx={pt.x}
                               cy={pt.y}
                               r={isDragging ? "1.6" : "1.1"}
                               fill={line.color}
                               stroke="#ffffff"
                               strokeWidth="0.3"
                               className="transition-all hover:scale-125 cursor-pointer"
                               onMouseDown={(e) => handleMouseDownOrTouchStart(i, idx, e)}
                               onTouchStart={(e) => handleMouseDownOrTouchStart(i, idx, e)}
                             />
                           </g>
                         );
                       })}
                     </g>
                   )
                })}
              </svg>
            </motion.div>
            
            {/* Calibration Controls */}
            <div className="flex justify-between items-center mt-3 px-1">
              <button
                onClick={() => setIsCalibrating(!isCalibrating)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  isCalibrating 
                    ? 'bg-purple-600/95 text-white shadow-md shadow-purple-500/20 hover:bg-purple-600 border border-purple-400/30' 
                    : 'bg-mystic-900/40 text-gold-400 border border-gold-500/25 hover:bg-mystic-950/70 hover:border-gold-500/50'
                }`}
              >
                {isCalibrating ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>完成微调 · 对齐手心</span>
                  </>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 animate-pulse text-gold-400" />
                    <span>🛠️ 开启手纹对齐微调</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleResetAlignment}
                className="text-xs text-white/30 hover:text-gold-400 transition-colors py-1.5 px-3 bg-mystic-900/20 hover:bg-mystic-950/50 rounded-lg border border-white/5 active:scale-95"
              >
                重置画线
              </button>
            </div>
            {isCalibrating && (
              <p className="text-[11px] text-purple-300/80 text-center mt-2 animate-pulse leading-snug">
                提示：在上方图片中，用手指直接<strong>按住并拖动</strong>彩色圆点，使其完美贴合你真实的掌纹。
              </p>
            )}
          </div>
        )}

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
            else if (section.includes('感情') || section.includes('婚姻')) Icon = Heart;
            else if (section.includes('智慧')) Icon = Brain;
            else if (section.includes('事业')) Icon = TrendingUp;
            else if (section.includes('能量')) Icon = Sparkles;
            else if (section.includes('建议') || section.includes('启示')) Icon = Moon;
            
            return (
              <motion.div 
                key={`reading-sec-${index}-${section.substring(0, 10).trim()}`}
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
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4 w-full">
        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-mystic-900 hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-bold shadow-lg ${isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
        >
          {isDownloading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ImageDown className="w-5 h-5" />}
          {isDownloading ? '生成神秘图卷中...' : '保存专属图文报告'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-mystic-800 border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 transition-all duration-300 font-medium"
        >
          {isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          {isCopied ? '已复制分享链接' : '分享至社群/朋友圈'}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/20 hover:border-white/40 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 font-medium"
        >
          <RefreshCcw className="w-5 h-5" />
          重新感应
        </button>
      </div>
    </motion.div>
  );
}
