import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Sparkles, Shield, CreditCard, 
  User, Flame, Moon, Compass, Lock, Zap, HelpCircle, 
  ChevronRight, ArrowLeft, Globe, Laptop, Settings, Link2, ExternalLink, Info
} from 'lucide-react';

interface UpgradePageProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
  isUnlocked: boolean;
}

export default function UpgradePage({ isOpen, onClose, onUpgradeSuccess, isUnlocked }: UpgradePageProps) {
  const [step, setStep] = useState<'pricing' | 'pay' | 'success'>('pricing');
  const [payMethod, setPayMethod] = useState<'card' | 'alipay' | 'wechat' | 'creem'>('creem');
  const [creemUrl, setCreemUrl] = useState(() => {
    return localStorage.getItem('creem_payment_url') || (import.meta.env.VITE_CREEM_PAYMENT_URL) || 'https://www.creem.io/test/payment/prod_4gRaqY7tJRWVfNl4aaWHLk';
  });
  const [inputUrl, setInputUrl] = useState(creemUrl);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [loading, setLoading] = useState(false);

  const handleSaveCreemUrl = (url: string) => {
    let cleanUrl = url.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }
    setCreemUrl(cleanUrl);
    setInputUrl(cleanUrl);
    localStorage.setItem('creem_payment_url', cleanUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSimulatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      onUpgradeSuccess();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="upgrade-page-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/90 backdrop-blur-md flex flex-col min-h-screen text-slate-800"
      >
        {/* Simulated Browser URL bar to satisfy "二级域名" request with premium aesthetic */}
        <div className="w-full bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center gap-4 text-xs font-mono text-slate-400 select-none shrink-0">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 bg-red-500/80 rounded-full inline-block" />
            <span className="w-3 h-3 bg-amber-500/80 rounded-full inline-block" />
            <span className="w-3 h-3 bg-emerald-500/80 rounded-full inline-block" />
          </div>
          
          <div className="flex-1 max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-between gap-2 shadow-inner text-[11px]">
            <div className="flex items-center gap-1 text-slate-500">
              <span className="text-emerald-500">https://</span>
              <span className="text-white font-bold leading-none">plus.mysticpalm.ai</span>
              <span className="text-slate-400">/pricing?ref=app</span>
            </div>
            <Globe className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <button 
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white rounded-lg transition-all text-xs font-sans cursor-pointer font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回占卜
          </button>
        </div>

        {/* Dynamic Multi-Step Subdomain Container */}
        <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 relative flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            {step === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-4xl mx-auto"
              >
                {/* Main Header */}
                <div className="text-center mb-10">
                  <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5">
                    Premium Account Plan
                  </span>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    升级套餐
                  </h1>
                  <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                    订阅高维星轨算力，解锁全面的掌纹探秘之趣与心意鸣合
                  </p>
                </div>

                {/* Subdomain Pricing Cards - Matching reference Layout perfectly */}
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
                  
                  {/* Left Column: Free Level */}
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-900">
                        免费版
                      </h3>
                      
                      {/* Price Element */}
                      <div className="mt-4 flex items-baseline">
                        <span className="text-lg font-bold text-slate-900">$</span>
                        <span className="text-5xl font-black text-slate-900 font-sans tracking-tight">0</span>
                        <span className="text-slate-400 font-medium text-xs ml-1.5">USD / 月</span>
                      </div>

                      <p className="text-[13px] text-slate-400 font-medium mt-3">
                        了解 AI 的基本掌纹分析
                      </p>

                      <div className="mt-6 border-t border-slate-100 pt-6">
                        <button
                          disabled
                          className="w-full py-3 px-4 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200/50 cursor-not-allowed text-center"
                        >
                          {isUnlocked ? '免费会员' : '你当前的套餐'}
                        </button>
                      </div>

                      {/* Features */}
                      <ul className="mt-8 space-y-4 text-xs text-slate-600 font-sans">
                        <li className="flex items-start gap-3">
                          <span className="text-slate-400 shrink-0 mt-0.5">✦</span>
                          <div>
                            <p className="font-bold text-slate-800">核心免费模型</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">提供基础 Gemini 1.5 Flash 能量算力支持</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-slate-400 shrink-0 mt-0.5">✦</span>
                          <div>
                            <p className="font-bold text-slate-800">有限额度的消息发送和文件上传</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">每日限制诊断分析次数</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-slate-400 shrink-0 mt-0.5">✦</span>
                          <div>
                            <p className="font-bold text-slate-800">有限的图片创建功能</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">只提取核心三大主线纹路，无法深层排盘</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-slate-400 shrink-0 mt-0.5">✦</span>
                          <div>
                            <p className="font-bold text-slate-800">有限的掌纹记忆</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">无法将报告一键快速同步至星宿云存档</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="mt-8 text-[11px] text-slate-400 font-medium">
                      已有套餐？ <button className="text-indigo-650 font-bold hover:underline cursor-pointer">查看账单帮助</button>
                    </div>
                  </div>

                  {/* Right Column: Plus Level (Customized per user requested) */}
                  <div className="bg-white rounded-3xl p-8 border-2 border-indigo-500 shadow-[0_20px_40px_rgba(99,102,241,0.08)] flex flex-col justify-between relative transform scale-[1.02]">
                    
                    {/* Floating popular banner */}
                    <div className="absolute top-4 right-4 bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
                      热门推荐
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-1.5">
                        Plus
                      </h3>
                      
                      {/* Price Element */}
                      <div className="mt-4 flex items-baseline">
                        <span className="text-lg font-bold text-indigo-600">$</span>
                        <span className="text-5xl font-black text-slate-900 font-sans tracking-tight">6.9</span>
                        <span className="text-slate-400 font-medium text-xs ml-1.5">USD / 月</span>
                      </div>

                      <p className="text-[13px] text-slate-500 font-medium mt-3">
                        解锁全部深度诊断与高维预测
                      </p>

                      <div className="mt-6 border-t border-slate-150 pt-6">
                        {isUnlocked ? (
                          <div className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-250 text-center flex items-center justify-center gap-1.5 select-none animate-pulse">
                            <Check className="w-4 h-4" />
                            已成功升级至 Plus 会员
                          </div>
                        ) : (
                          <button
                            onClick={() => setStep('pay')}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.985] duration-150 text-center"
                          >
                            升级至 Plus
                          </button>
                        )}
                      </div>

                      {/* Features wrapper */}
                      <ul className="mt-8 space-y-4 text-xs text-slate-600 font-sans">
                        <li className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800 flex items-center gap-1">
                              高级模型算力授权
                              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">解锁高阶商用 GPT-4o 掌析推理</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800">更多消息和上传限额</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">不限制执掌分析次数，无限次深度研判</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800">微调高阶校准手盘</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">开启手经脉路微调 AR 交互定位，精细修正预测</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800">神圣辅助线全脉络破译</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">多层次探测「健康线」「直觉线」「第二火星丘」</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800">云端无限星宫档案保存</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">解锁 10GB 专属保密云存档，多设备实时同步</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800">高维声音能量疗愈机制</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">专享高阶颂钵及梵音音轨，增强自我认知冥想</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="mt-8 text-[11px] text-slate-400 font-medium">
                      注：此计划由天宿引擎保证安全，支持随时一键解约和全额退款。
                    </div>
                  </div>

                </div>

                <div className="text-center mt-12">
                  <button 
                    onClick={() => setStep('pay')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline hover:underline cursor-pointer"
                  >
                    查看全部套餐
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'pay' && (
              <motion.div
                key="pay"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-[430px] mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_24px_50px_rgba(0,0,0,0.06)]"
              >
                {/* Back Link */}
                <button
                  type="button"
                  onClick={() => setStep('pricing')}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回选择套餐
                </button>

                <div className="mb-6">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">Secure Checkout</span>
                  <h3 className="text-2xl font-black text-slate-900">收银台与星罗支付</h3>
                  <p className="text-xs text-slate-500 mt-1">您正准备向 MysticPalm.AI 支付一年期或月度算力维护费</p>
                </div>

                {/* Bill details */}
                <div className="p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100 flex justify-between items-center text-xs text-slate-700">
                  <div>
                    <p className="font-bold text-slate-950">MysticPalm Plus 终身研判年卡</p>
                    <p className="text-slate-400 mt-0.5">提供全面模型授权及脉路修配服务</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-600 text-base">$6.9 USD</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">/ 每月</p>
                  </div>
                </div>

                {/* Simulated payment options */}
                <div className="grid grid-cols-4 gap-1.5 mb-6">
                  <button
                    type="button"
                    onClick={() => setPayMethod('creem')}
                    className={`p-2 py-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col justify-between items-center h-[72px] ${
                      payMethod === 'creem' 
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700' 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-[8px] font-extrabold uppercase tracking-widest bg-indigo-600 text-white px-1 py-0.5 rounded-sm">官方</span>
                    <span className="text-[10.5px] font-black block leading-none mt-1">Creem 极速</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('card')}
                    className={`p-2 py-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col justify-between items-center h-[72px] ${
                      payMethod === 'card' 
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700' 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto text-slate-400" />
                    <span className="text-[10.5px] font-bold block leading-none">模拟双币卡</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('alipay')}
                    className={`p-2 py-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col justify-between items-center h-[72px] ${
                      payMethod === 'alipay' 
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700' 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <div className="mx-auto font-black text-blue-500 italic text-[11px]">支</div>
                    <span className="text-[10.5px] font-bold block leading-none">模拟支付宝</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('wechat')}
                    className={`p-2 py-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col justify-between items-center h-[72px] ${
                      payMethod === 'wechat' 
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700' 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <div className="mx-auto font-black text-emerald-500 text-[11px]">微</div>
                    <span className="text-[10.5px] font-bold block leading-none">模拟微信</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {payMethod === 'creem' ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black tracking-wider text-indigo-400 font-sans">
                              CREEM OFFICIAL
                            </span>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                              REAL Live
                            </span>
                          </div>
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        
                        <p className="text-[10.5px] text-slate-300 leading-relaxed">
                          接入 **Leo store** 境外快捷支付通道。支持全球 Visa/Mastercard、Apple Pay 和 PayPal 付款。
                        </p>
                        
                        <div className="mt-3 space-y-2">
                          <button
                            type="button"
                            onClick={() => window.open(creemUrl, '_blank', 'noreferrer,noopener')}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>去 Creem 极速安全支付 ($6.9)</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleSimulatePayment}
                            className="w-full py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-indigo-300 hover:text-white font-medium text-[10px] rounded-lg transition-all"
                          >
                            ✨ 支付已完成？立即手动激活同步权益
                          </button>
                        </div>
                      </div>

                      {/* Configurable checkout link panel */}
                      <div className="border border-slate-150 bg-slate-50 rounded-2xl overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => setIsConfigOpen(!isConfigOpen)}
                          className="w-full px-4 py-2.5 flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100/65 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-1 text-slate-700">
                            <Settings className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                            <span>上架与更换您的 Creem 支付链接 ⚙️</span>
                          </div>
                          <span className="text-[10px] text-indigo-600 hover:underline">
                            {isConfigOpen ? '收起配置' : '展开上架说明'}
                          </span>
                        </button>
                        
                        {isConfigOpen && (
                          <div className="p-3.5 bg-white border-t border-slate-150 space-y-3">
                            <div className="text-[11px] text-slate-500 space-y-1 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/30">
                              <p className="font-bold text-slate-800 flex items-center gap-1">
                                <Info className="w-3 h-3 text-indigo-500" />
                                3步轻松完成上架：
                              </p>
                              <p className="text-[10px] leading-relaxed text-slate-600">
                                1. 登录您的 <strong>Creem 商家后台</strong> (如截图 <em>Leo store</em>)。<br/>
                                2. 点击左侧菜单 <strong>「产品」 (Products)</strong>，创建或点击您的 Plus 套餐 ($6.9 USD)。<br/>
                                3. 复制生成的 <strong>Checkout Link (支付链接)</strong> 并粘贴到下方保存！
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block">自定义 Creem 支付 URL</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="https://creem.io/c/leostore..."
                                  value={inputUrl}
                                  onChange={(e) => setInputUrl(e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveCreemUrl(inputUrl)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                                >
                                  保存配置
                                </button>
                              </div>
                              {saveSuccess && (
                                <p className="text-[10px] text-emerald-600 font-bold animate-pulse mt-1">
                                  ✓ 恭喜！Leo store 的 Creem 支付链接已实时上架！
                                </p>
                              )}
                              <p className="text-[9px] text-slate-400 leading-tight">
                                提示：在 <code>.env.example</code> 中定义 <code>VITE_CREEM_PAYMENT_URL</code> 变量可预置默认链接。
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : payMethod === 'card' ? (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">卡号</label>
                        <div className="relative">
                          <input
                             type="text"
                             value={cardNumber}
                             onChange={(e) => setCardNumber(e.target.value)}
                             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">有效期</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM / YY"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono text-center focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">安全码 (CVC)</label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="123"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono text-center focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 bg-slate-50 border border-slate-150 rounded-2xl text-center">
                      <div className="w-32 h-32 bg-white border-2 border-slate-200/60 rounded-xl mx-auto flex items-center justify-center p-2 mb-3 shadow-inner relative">
                        {/* Custom SVG QR Code Simulator */}
                        <svg className="w-full h-full text-slate-800" viewBox="0 0 100 100">
                          <rect width="100" height="100" fill="none" />
                          <path d="M10 10h20v20h-20zm0 60h20v20h-20zm60-60h20v20h-20zM20 20h2v2h-2zm0 60h2v2h-2zm60-60h2v2h-2z" fill="currentColor" />
                          <path d="M40 10h5v10h-5zm0 20h10v5h-10zm25 15h10v5h-10zm-15 15h5v20h-5zm30-20h5v10h-5zm0 15h5v5h-5z" fill="currentColor opacity-60" />
                          <path d="M30 45h5v5h-5zm10 5h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm-30 10h5v5h-5zm15 15h5v5h-5z" fill="currentColor" />
                          <rect x="42" y="42" width="16" height="16" rx="4" fill="white" />
                          <text x="50" y="52" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#4f46e5">🔮</text>
                        </svg>
                        <div className="absolute inset-x-0 bottom-1 mx-auto max-w-[85px] bg-slate-900/80 backdrop-blur-[2px] rounded-full text-[8px] text-white py-0.5">
                          测试通道激活
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        使用手机{payMethod === 'alipay' ? '支付宝' : '微信'}扫描上方星海付款码
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-4">
                    <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[10px] text-slate-400">所有星海会费均采用万能SSL级星轨加密信箱防护</span>
                  </div>

                  <button
                    type="button"
                    onClick={payMethod === 'creem' ? () => window.open(creemUrl, '_blank', 'noreferrer,noopener') : handleSimulatePayment}
                    disabled={loading}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : payMethod === 'creem' ? (
                      <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> 去 Creem 支付 ＆ 开启限额</span>
                    ) : (
                      <span>立即安全支付 $6.9 USD</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[390px] mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_24px_50px_rgba(0,0,0,0.06)] text-center"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full border border-emerald-250 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>

                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-600 block mb-1">Payment Completed</span>
                <h3 className="text-2xl font-black text-slate-900">Plus 宿命权限激活！</h3>
                
                <p className="text-xs text-slate-500 mt-3.5 leading-relaxed">
                  恭喜您！由于高维心之共鸣被圆满接引，您的账户已安全晋升至 <strong>MysticPalm Plus 终身研判级</strong>。<br/>
                  商用 GPT-4o 模型权限、微调交互辅助线脉络现已全数解锁！
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-left text-[11px] text-slate-600 space-y-1.5 my-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">天命归口</span>
                    <span className="font-mono text-slate-900 select-all font-bold">leogo0626@gmail.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">会费档位</span>
                    <span className="text-indigo-650 font-bold">$6.9 USD / 月</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">算力等级</span>
                    <span className="text-emerald-700 font-bold">Plus 脉络师</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  即刻回归，探秘副线
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
