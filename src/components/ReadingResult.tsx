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

interface VintageDetail {
  id: number;
  name: string;
  shortTitle: string;
  content: string;
}

const getVintageName = (id: number): string => {
  switch(id) {
    case 1: return "生命线";
    case 2: return "智慧线";
    case 3: return "感情线";
    case 4: return "命运线";
    case 5: return "太阳线";
    case 6: return "健康线";
    case 7: return "婚姻线";
    case 8: return "财运纹";
    case 9: return "掌色气血";
    case 10: return "金星丘";
    default: return "";
  }
};

const getVintagePointerProps = (id: number, isRight: boolean) => {
  let labelX = 5;
  let labelY = 50;
  let targetX = 50;
  let targetY = 50;
  
  switch(id) {
    case 1:  targetX = 40; targetY = 62; labelX = 14;  labelY = 53; break; // 生命线
    case 2:  targetX = 35; targetY = 48; labelX = 14;  labelY = 37; break; // 智慧线
    case 3:  targetX = 45; targetY = 38; labelX = 25;  labelY = 16; break; // 感情线
    case 4:  targetX = 50; targetY = 56; labelX = 86;  labelY = 49; break; // 命运线
    case 5:  targetX = 43; targetY = 30; labelX = 14;  labelY = 25; break; // 太阳线
    case 6:  targetX = 64; targetY = 68; labelX = 86;  labelY = 61; break; // 健康线
    case 7:  targetX = 74; targetY = 33; labelX = 86;  labelY = 25; break; // 婚姻线
    case 8:  targetX = 68; targetY = 42; labelX = 86;  labelY = 37; break; // 财运纹
    case 9:  targetX = 52; targetY = 78; labelX = 86;  labelY = 73; break; // 掌色与气血
    case 10: targetX = 26; targetY = 72; labelX = 14;  labelY = 69; break; // 金星丘
  }
  
  if (isRight) {
    targetX = 100 - targetX;
    labelX = 100 - labelX;
  }
  
  return { labelX, labelY, targetX, targetY };
};

const parsePalmReadingToVintage = (reading: string, handType: 'left' | 'right') => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const cleanReading = reading.replace(jsonRegex, '').trim();
  const sections = cleanReading.split(/(?=##\s)/);
  
  const findSection = (keywords: string[]) => {
    return sections.find(sec => keywords.some(kw => sec.includes(kw))) || "";
  };

  const secEnergy = findSection(["整体能量", "星核掌型"]);
  const secLife = findSection(["生命线"]);
  const secWisdom = findSection(["智慧线"]);
  const secHeart = findSection(["感情线"]);
  const secCareer = findSection(["事业线", "命运"]);
  const secLove = findSection(["羁绊边界", "亲密", "婚姻"]);
  const secAdvice = findSection(["星尘启示", "灵魂共振", "灵魂催化剂"]);

  const extractSentences = (text: string, keywords: string[], fallbackStr: string): { title: string, text: string } => {
    if (!text) return { title: "斑驳呈祥", text: fallbackStr };
    const cleanedText = text.replace(/^##.*?\n/, '').trim();
    const sentences = cleanedText.split(/[。！\n]/)
      .map(s => s.trim().replace(/^[-*#0-9.\s]+/, ''))
      .filter(s => s.length > 5);
    
    let matches = sentences.filter(s => keywords.some(kw => s.includes(kw)));
    if (matches.length === 0) {
      matches = sentences.slice(0, 2);
    }
    
    const combinedText = matches.slice(0, 2).join("。") + "。";
    
    let title = "根基深厚，福泽悠长";
    if (keywords.includes("生命")) {
      title = combinedText.includes("长") || combinedText.includes("深") || combinedText.includes("力") 
        ? "深长包拢，气脉充沛" 
        : "清秀细致，柔中带刚";
    } else if (keywords.includes("智慧")) {
      title = combinedText.includes("曲") || combinedText.includes("弯") || combinedText.includes("月") 
        ? "弧度悠美，悟性不凡" 
        : "平直深刻，利落地落思维";
    } else if (keywords.includes("感情")) {
      title = combinedText.includes("分") || combinedText.includes("支") || combinedText.includes("细")
        ? "清晰明秀，重情极真"
        : "平正深长，内蕴温良";
    } else if (keywords.includes("事业") || keywords.includes("命运")) {
      title = "直贯中宫，厚积薄发";
    } else if (keywords.includes("太阳") || keywords.includes("名气")) {
      title = "暗香浮动，多得提携";
    } else if (keywords.includes("健康") || keywords.includes("气血")) {
      title = "神定气和，动静咸宜";
    } else if (keywords.includes("婚姻") || keywords.includes("羁绊")) {
      title = "姻缘清奇，贵在赤诚";
    } else if (keywords.includes("财")) {
      title = "财气聚凝，守中有得";
    } else if (keywords.includes("红") || keywords.includes("掌色")) {
      title = "色泽温润，肌肉笃实";
    } else if (keywords.includes("金星") || keywords.includes("丘")) {
      title = "地势宽厚，长情长乐";
    }

    return { title, text: combinedText.length > 5 ? combinedText : fallbackStr };
  };

  const results: VintageDetail[] = [];

  const res1 = extractSentences(secLife, ["生命", "体力", "能量", "气魄", "耐力"], "主根基稳厚，耐力充足，做事不畏熬磨。平时生活节奏坚韧，能以极强的韧性克难前行。");
  results.push({ id: 1, name: "生命线", shortTitle: res1.title, content: res1.text });

  const res2 = extractSentences(secWisdom, ["智慧", "认知", "思维", "理智", "策略", "头脑"], "思维缜密，洞察见地强。既具备务实逻辑，又蕴含丰富的想象空间，悟性远超常人。");
  results.push({ id: 2, name: "智慧线", shortTitle: res2.title, content: res2.text });

  const res3 = extractSentences(secHeart, ["感情", "情愫", "依恋", "敏感", "温厚"], "为人极富重意，外冷内热。一旦认定便抱持极高赤诚，偶尔嘴上克制，实则内心温暖体贴。");
  results.push({ id: 3, name: "感情线", shortTitle: res3.title, content: res3.text });

  const res4 = extractSentences(secCareer, ["事业", "命运", "成就", "目标"], "多靠自身踏实积累与稳扎稳打。步入中年后往往具有极强的转换能力或平台飞跃潜力。");
  results.push({ id: 4, name: "命运线", shortTitle: res4.title, content: res4.text });

  const res5 = extractSentences(secCareer || secAdvice, ["太阳", "名气", "声誉", "贵人"], "声势公信名望属于厚积薄发之相。多凭靠谱的名誉与扎实的行事风格，得贵人认可。");
  results.push({ id: 5, name: "太阳线", shortTitle: res5.title, content: res5.text });

  const res6 = extractSentences(secLife || secEnergy, ["健康", "脏腑", "脾胃", "肩颈", "作息", "睡眠"], "整体精气尚可，从中医掌诊看，唯注意平时不宜久坐，需防脾胃消化或肩颈疲劳。");
  results.push({ id: 6, name: "健康线", shortTitle: res6.title, content: res6.text });

  const res7 = extractSentences(secLove, ["婚姻", "亲密", "伴侣", "羁绊", "承诺"], "寻觅注重彼此精神契合度。重情而不愿迎合将就，常守候长流不息的深刻交情。");
  results.push({ id: 7, name: "婚姻线", shortTitle: res7.title, content: res7.text });

  const res8 = extractSentences(secCareer || secAdvice, ["财", "富", "金水", "盈余", "蓄"], "正财通透，适宜靠一技之长与长期理财。为人消费有度，守财得法，积水成潭。");
  results.push({ id: 8, name: "财运纹", shortTitle: res8.title, content: res8.text });

  const res9 = extractSentences(secEnergy, ["气血", "掌色", "红", "粉", "手掌"], "气血厚实，手掌丰润，精神昂扬。唯注意心性追求至善至美容易心神内耗，宽心则泰。");
  results.push({ id: 9, name: "掌色与气血", shortTitle: res9.title, content: res9.text });

  const res10 = extractSentences(secLife || secEnergy, ["金星丘", "金星", "肉垫", "饱满", "丘"], "重情重义，顾家怀旧。精力丰润不竭，为人具有热心肠与极可靠的行动托付力。");
  results.push({ id: 10, name: "金星丘/拇指根部", shortTitle: res10.title, content: res10.text });

  const trends: string[] = [];
  if (secAdvice) {
    const listItems = secAdvice.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line))
      .map(line => line.replace(/^[-*\d.\s]+/, '').trim());
    
    listItems.slice(0, 3).forEach(item => {
      if (item && item.length > 5 && trends.length < 3) {
        trends.push(item);
      }
    });
  }
  
  if (trends.length < 3) {
    trends.push("未来2-3年宜守常求稳、休养生息，少做盲目投资和被动决策。");
    trends.push("贵人常在志同道合与朋友圈层显露，建立深度互信更有倍增力。");
    trends.push("保持适度锻炼、早睡早起，生命气机升发则整体运势将强劲跃迁。");
  }

  return { results, trends };
};

export default function ReadingResult({ reading, handType, imageSrc, onReset, onDeepDive }: ReadingResultProps) {
  const [activeFilter, setActiveFilter] = useState('全部');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [themeMode, setThemeMode] = useState<'mystic' | 'vintage'>('mystic');
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
    
    const fallback = getFallbackLinesState(handType || 'left');
    let merged = [];
    
    if (data && data.lines && data.lines.length > 0) {
      const parsedLinesMap = new Map();
      data.lines.forEach((line: any) => {
        if (line.name && line.points && line.points.length >= 2) {
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

  // Vintage memo results
  const vintageData = React.useMemo(() => {
    return parsePalmReadingToVintage(cleanReading, handType || 'left');
  }, [cleanReading, handType]);

  // Sync with Gemini parsed lines / fallbacks when they change
  React.useEffect(() => {
    if (finalLines && finalLines.length > 0) {
      setCustomLines(finalLines);
    }
  }, [finalLines]);

  const updatePointPosition = React.useCallback((clientX: number, clientY: number) => {
    if (draggingPoint === null || !containerRef.current || !customLines) return;
    const rect = containerRef.current.getBoundingClientRect();
    
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
  const sections = cleanReading.split(/(?=##\s)/);

  const handleShare = async () => {
    const plainText = cleanReading.replace(/[*#]/g, '').trim();
    const shareText = `【玄学掌纹解析解读】\n\n${plainText}\n\n✨ 命自我造，福自我求，快来测测你的专属手相吧！`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的神秘手相古风解读',
          text: shareText,
        });
      } catch (err) {
        console.log('分享被取消或失败', err);
      }
    } else {
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
      await new Promise(r => setTimeout(r, 200));
      
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: themeMode === 'vintage' ? '#faf5e8' : '#0F0C29',
        scale: 2.5, // Ultra-high resolution output
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `掌纹玄学解析报告_${new Date().getTime()}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("生成图卷报告失败", err);
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
      {/* Theme Switcher Toggle Tabs */}
      <div className="flex gap-2 p-1 bg-mystic-950/75 border border-gold-500/20 rounded-xl mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setThemeMode('mystic')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            themeMode === 'mystic' 
              ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-mystic-900 font-bold shadow-[0_0_10px_rgba(212,175,55,0.3)]' 
              : 'text-gold-400/60 hover:text-gold-400 hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          星河解构（现代黑金版）
        </button>
        <button
          onClick={() => setThemeMode('vintage')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            themeMode === 'vintage' 
              ? 'bg-[#5c0f10] text-[#fdfaf2] font-semibold tracking-wide shadow-[0_0_15px_rgba(92,15,16,0.5)]' 
              : 'text-gold-400/60 hover:text-gold-400 hover:bg-white/5'
          }`}
        >
          <span>📜</span>
          玄学图卷（复古画卷版）
        </button>
      </div>

      {themeMode === 'vintage' ? (
        /* Vintage Traditional Parchment Theme */
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gold-500/30 flex justify-start sm:justify-center">
          <div 
            ref={reportRef} 
            className="w-[840px] shrink-0 bg-gradient-to-b from-[#fefcf8] via-[#fbf7eb] to-[#f4ead5] text-[#2c1d11] p-10 relative flex flex-col border-[10px] border-double border-[#5c0f10] rounded-sm select-none shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
            style={{ fontFamily: "'Noto Serif SC', 'Yu Mincho', Georgia, serif" }}
          >
            {/* Corner Bracket Accents */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-[3px] border-l-[3px] border-[#d4af37]" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-[3px] border-r-[3px] border-[#d4af37]" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-[3px] border-l-[3px] border-[#d4af37]" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-[3px] border-r-[3px] border-[#d4af37]" />

            {/* Traditional Stamp */}
            <div className="absolute top-8 right-12 border-[2px] border-red-600/80 p-0.5 text-red-600 font-serif font-extrabold text-[10px] tracking-tighter leading-none flex items-center justify-center rounded-sm rotate-6 select-none opacity-80 shadow-[0_0_2px_rgba(220,38,38,0.2)]">
              <div className="border border-red-600/50 px-1 py-1 flex flex-col items-center">
                <span>乾坤</span>
                <span>手相</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mb-6">
              <h1 className="text-4xl text-[#5c0f10] font-black tracking-widest text-center m-0 select-none">
                掌纹玄学解析报告
              </h1>
              <div className="flex items-center justify-center gap-4 mt-2.5 w-full max-w-[480px]">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#5c0f10]/80" />
                <p className="text-xs text-[#5c0f10] font-bold tracking-[0.2em] font-serif m-0 select-none">
                  结合易经手相、中医掌诊与传统民俗分析
                </p>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#5c0f10]/80" />
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-12 gap-8 items-stretch mt-6">
              {/* Left Side: Hand Diagram overlay (col-span-5) */}
              <div className="col-span-5 flex flex-col justify-between gap-6">
                <div className="relative w-full aspect-[4/5] bg-[#ebd8be]/50 rounded-xl overflow-hidden border-2 border-[#5c0f10]/30 shadow-inner p-1 select-none">
                  {imageSrc ? (
                    <img 
                      src={imageSrc} 
                      alt="User Palm" 
                      className="w-full h-full object-cover grayscale sepia contrast-125 brightness-95 opacity-80 mix-blend-multiply rounded-lg"
                      style={{ filter: "sepia(0.35) contrast(1.15) brightness(0.95)" }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#dfd0bd] flex items-center justify-center border border-dashed border-[#5c0f10]/20 rounded-lg">
                      <span className="text-[#5c0f10]/40 font-serif text-sm">手相画卷</span>
                    </div>
                  )}
                  
                  {/* Pointer lines & traces */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Traced Hand Lines in Crimson */}
                    {displayLines && displayLines.length > 0 && displayLines
                      .filter((line: any) => line.points && line.points.length >= 2)
                      .map((line: any, idx: number) => {
                        const pathD = createSmoothCurve(line.points);
                        return (
                          <g key={`vintage-cinnabar-line-${idx}`}>
                            <path d={pathD} fill="none" stroke="#fff1db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                            <path d={pathD} fill="none" stroke="#a12122" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
                          </g>
                        );
                      })}

                    {/* Dotted helper lines */}
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const id = idx + 1;
                      const props = getVintagePointerProps(id, handType === 'right');
                      return (
                        <g key={`pointer-group-${id}`}>
                          <line 
                            x1={`${props.labelX}%`} 
                            y1={`${props.labelY}%`} 
                            x2={`${props.targetX}%`} 
                            y2={`${props.targetY}%`} 
                            stroke="#5c0f10" 
                            strokeWidth="1.0" 
                            strokeDasharray="2,2" 
                            opacity="0.65"
                          />
                          <circle 
                            cx={`${props.targetX}%`} 
                            cy={`${props.targetY}%`} 
                            r="2" 
                            fill="#faf5e8" 
                            stroke="#5c0f10" 
                            strokeWidth="1.3" 
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Absolute Labels overlay */}
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const id = idx + 1;
                    const name = getVintageName(id);
                    const props = getVintagePointerProps(id, handType === 'right');
                    const circleIcons = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
                    return (
                      <div 
                        key={`vintage-badge-${id}`}
                        className="absolute bg-[#5c0f10] text-[#fdfaf2] text-[9.5px] font-sans font-medium px-1.5 py-0.5 rounded shadow-sm border border-[#fdfaf2]/20 flex items-center gap-1 select-none whitespace-nowrap z-10"
                        style={{ 
                          left: `${props.labelX}%`, 
                          top: `${props.labelY}%`, 
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)' 
                        }}
                      >
                        <span className="text-[#d4af37]">{circleIcons[id]}</span>
                        <span>{name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Vertical Trend warning box */}
                <div className="w-full flex bg-[#f5ebd6] border-[2px] border-[#5c0f10]/80 rounded-sm select-none">
                  <div className="w-10 bg-[#5c0f10] text-[#fdfaf2] font-serif font-black py-4 px-1 flex flex-col items-center justify-center text-xs tracking-widest leading-none select-none shrink-0 border-r border-[#5c0f10]/40">
                    <span className="mb-1">趋</span>
                    <span className="mb-1">势</span>
                    <span className="mb-1">提</span>
                    <span>醒</span>
                  </div>
                  <div className="flex-1 p-3.5 flex flex-col justify-center gap-2 text-left font-serif">
                    {vintageData.trends.map((trend, i) => (
                      <div key={`vintage-trend-${i}`} className="flex items-start gap-1.5 text-[10.5px] leading-relaxed">
                        <span className="text-[#a12122] text-xs shrink-0 select-none mt-0.5">🔸</span>
                        <span className="text-[#3c3024] font-semibold">{trend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: 1-10 details list (col-span-7) */}
              <div className="col-span-7 flex flex-col justify-between pl-4 border-l border-[#5c0f10]/15 text-left select-none">
                <div className="space-y-4 pr-1">
                  {vintageData.results.map((item) => (
                    <div key={`vintage-item-${item.id}`} className="flex gap-2.5 items-start">
                      <span className="shrink-0 bg-[#5c0f10] text-[#faf5e8] ring-1 ring-[#5c0f10]/30 rounded-full w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold mt-0.5 select-none">
                        {item.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-black text-[#5c0f10] m-0 leading-tight mb-1 select-none flex items-center gap-1">
                          <span className="font-serif">{item.name}：{item.shortTitle}</span>
                        </h4>
                        <p className="text-[10.5px] text-[#42362b] m-0 leading-relaxed font-sans select-none">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex flex-col items-center justify-center border-t border-[#5c0f10]/15 pt-5 w-full select-none">
              <p className="text-[9.5px] text-[#5c0f10]/70 font-semibold tracking-wider text-center m-0 max-w-[620px] leading-relaxed font-serif">
                注：本报告基于易经手相、中医反射区与传统民俗学理整合分析，仅供参考，不作为医学或命学之绝对主张。命运在人，修行在己。
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Original Premium Star Night Theme */
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
                  {displayLines
                    .map((line: any, i: number) => ({ line, originalIndex: i }))
                    .filter(({ line }) => line.points && line.points.length >= 2)
                    .filter(({ line }) => activeFilter === '全部' || activeFilter === line.name)
                    .map(({ line, originalIndex: i }) => {
                      const pathD = createSmoothCurve(line.points);
                      const textPoint = line.points[Math.floor(line.points.length / 2)];
                      
                      return (
                        <g key={`line-group-${i}`}>
                          <motion.path 
                            initial={{ pathLength: 0, opacity: 0 }} 
                            animate={{ pathLength: 1, opacity: 0.4 }} 
                            transition={{ duration: 2.5, delay: i * 0.5 + 0.2, ease: "easeInOut" }}
                            d={pathD} fill="none" stroke={line.color} strokeWidth={isCalibrating ? "2" : "3"} strokeLinecap="round" strokeLinejoin="round" 
                            style={{ filter: 'blur(3px)' }}
                          />
                          <motion.path 
                            initial={{ pathLength: 0 }} 
                            animate={{ pathLength: 1 }} 
                            transition={{ duration: 2.5, delay: i * 0.5, ease: "easeInOut" }}
                            d={pathD} fill="none" stroke={line.color} strokeWidth={isCalibrating ? "1.6" : "1.2"} strokeLinecap="round" strokeLinejoin="round" 
                          />
                          <motion.circle initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 + 2.5 }} cx={line.points[0].x} cy={line.points[0].y} r="1" fill={line.color} />
                          <motion.circle initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 + 2.5 }} cx={line.points[line.points.length-1].x} cy={line.points[line.points.length-1].y} r="1" fill={line.color} />
                          
                          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 + 2 }}>
                            <rect x={textPoint.x - 2} y={textPoint.y - 4.5} width="16" height="5" fill="rgba(15, 12, 41, 0.7)" rx="1" />
                            <text x={textPoint.x} y={textPoint.y - 1} fill={line.color} fontSize="3" fontWeight="bold" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.9)" }}>{line.name}</text>
                          </motion.g>

                          {isCalibrating && line.points.map((pt: any, idx: number) => {
                            const isDragging = draggingPoint?.lineIndex === i && draggingPoint?.pointIndex === idx;
                            return (
                              <g key={`point-handle-${i}-${idx}`} className="cursor-pointer pointer-events-auto">
                               <circle
                                 cx={pt.x}
                                 cy={pt.y}
                                 r="4.5"
                                 fill="transparent"
                                 className="cursor-pointer"
                                 onMouseDown={(e) => handleMouseDownOrTouchStart(i, idx, e)}
                                 onTouchStart={(e) => handleMouseDownOrTouchStart(i, idx, e)}
                               />
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
            {sections
              .map((section, index) => ({ section, index }))
              .filter(({ section }) => section.trim().length > 0)
              .map(({ section, index }) => {
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
                    key={`reading-sec-${index}`}
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
      )}

      {/* Footer Controls Buttons */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 w-full">
        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r ${themeMode === 'vintage' ? 'from-amber-800 to-amber-600 text-white hover:from-amber-700 hover:to-amber-500' : 'from-gold-600 to-gold-500 text-mystic-900 hover:from-gold-500 hover:to-gold-400'} transition-all duration-300 font-bold shadow-lg ${isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
        >
          {isDownloading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ImageDown className="w-5 h-5" />}
          {isDownloading ? '绘制神秘大卷中...' : (themeMode === 'vintage' ? '保存手相古风大图' : '保存专属图文报告')}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-mystic-800 border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 transition-all duration-300 font-medium animate-pulse"
        >
          {isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          {isCopied ? '链接复制成功' : '分享至微信/朋友圈'}
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
