import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, KeyRound, Check, ShieldCheck, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [provider, setProvider] = useState<'smtp' | 'demo' | 'demo-fallback'>('demo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Tab/State for Login vs Register to match screenshot toggle perfectly
  const [isSignUp, setIsSignUp] = useState(false);

  // States for interactive custom overlays
  const [activePolicy, setActivePolicy] = useState<'user' | 'privacy' | null>(null);
  const [socialPicker, setSocialPicker] = useState<'google' | 'facebook' | null>(null);
  const [shakeConsent, setShakeConsent] = useState(false);

  // Reset states on opening or closing
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setVerificationCode('');
      setIsAgreed(false);
      setIsCounting(false);
      setCountdown(60);
      setError('');
      setLoading(false);
      setSocialPicker(null);
      setIsSignUp(false);
    }
  }, [isOpen]);

  // Handle Countdown Ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
      setCountdown(60);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  const isCodeValid = verificationCode.trim().length === 4;
  const isFormFilled = isEmailValid && isCodeValid;

  // Send Code Trigger
  const handleSendCode = async () => {
    if (!email) {
      setError('请输入电子邮箱以接引星轨密匙');
      return;
    }

    if (!isEmailValid) {
      setError('电子邮箱格式不正确，请重新输入');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '传送星轨验证密匙受阻，请稍后重试');
      }

      setProvider(data.provider);
      if (data.code) {
        setGeneratedCode(data.code);
      } else {
        setGeneratedCode(''); // Handled securely on SMTP server side
      }

      // Start countdown
      setIsCounting(true);
    } catch (err: any) {
      setError(err.message || '网络连接有误，请稍后重新获取验证码');
    } finally {
      setLoading(false);
    }
  };

  // Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmailValid) {
      setError('请输入正确的电子邮箱地址');
      return;
    }

    if (!isCodeValid) {
      setError('请输入正确的 4 位星轨验证密匙');
      return;
    }

    // Consent Check
    if (!isAgreed) {
      setShakeConsent(true);
      setError('登入占星殿前，请勾选并同意《用户使用协议》和《隐私权保护政策》');
      setTimeout(() => setShakeConsent(false), 600);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          code: verificationCode.trim() 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '验证密匙不匹配或已过期，请重新校准');
      }

      onLoginSuccess(email.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || '检验失败，验证码不正确或连接异常');
    } finally {
      setLoading(false);
    }
  };

  // Simulated Social Quick Auth Trigger handler
  const triggerSocialLoginSimulated = (selectedEmail: string) => {
    setLoading(true);
    setSocialPicker(null);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(selectedEmail);
      onClose();
    }, 1100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          {/* Main Card with High-fidelity Hybrid Light Design matching the reference image */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 26, stiffness: 360 }}
            className="relative bg-white text-slate-800 rounded-2xl w-full max-w-[430px] overflow-hidden shadow-[0_24px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col p-8 select-none"
          >
            {/* Close Accent Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer z-10"
              aria-label="关闭窗口"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo and Brand Header */}
            <div className="text-center mt-2 flex flex-col items-center">
              
              {/* Logo icon with left cartoon element + right text */}
              <div className="flex items-center gap-1.5 mb-1 justify-center">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg shadow-sm">
                  🧙‍♂️
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-800 font-sans">
                  MysticPalm<span className="text-indigo-600 font-bold">.AI</span>
                </span>
              </div>

              {/* Title matches visual references */}
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
                一体化AI占星平台
              </h2>
              
              {/* Sub link: "已有账号？ 登录" (only show if isSignUp is true, matches reference perfectly) */}
              <div className="mt-1.5 min-h-[1.5rem]">
                {isSignUp ? (
                  <p className="text-[13px] text-slate-500 font-medium">
                    已有账号？{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setError('');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold ml-1 cursor-pointer hover:underline"
                    >
                      登录
                    </button>
                  </p>
                ) : (
                  <p className="text-[13px] text-slate-400 font-normal">
                    高品质的一掌天命，即刻洞悉前程
                  </p>
                )}
              </div>
            </div>

            {/* Hybrid Login Components Wrapper */}
            <div className="space-y-4.5 mt-5">
              
              {/* 1. GOOGLE LOGIN BUTTON (Standard SVG Google colors) */}
              <button
                type="button"
                onClick={() => setSocialPicker('google')}
                disabled={loading}
                className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[13.5px] rounded-xl transition-all flex items-center justify-center gap-3.5 cursor-pointer active:scale-[0.985] duration-100 shadow-sm"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-1.14 2.77-2.4 3.61v3h3.86c2.26-2.09 3.59-5.17 3.59-8.44z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.13C3.26 20.17 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.58H1.29a11.99 11.99 0 0 0 0 10.84l3.98-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 3.83 1.29 7.58l3.98 3.13c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>使用Google登录</span>
              </button>

              {/* 2. FACEBOOK LOGIN BUTTON (As requested in screen reference) */}
              <button
                type="button"
                onClick={() => setSocialPicker('facebook')}
                disabled={loading}
                className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[13.5px] rounded-xl transition-all flex items-center justify-center gap-3.5 cursor-pointer active:scale-[0.985] duration-100 shadow-sm"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>使用Facebook登录</span>
              </button>

              {/* Divider Or continue with */}
              <div className="flex items-center text-slate-300 py-1">
                <div className="flex-1 h-[1px] bg-slate-200" />
                <span className="px-3 text-xs text-slate-400 font-normal tracking-wide whitespace-nowrap bg-white select-none">
                  Or continue with
                </span>
                <div className="flex-1 h-[1px] bg-slate-200" />
              </div>

              {/* EMAIL + VERIFICATION FORM (matches image fields exactly) */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                
                {/* Field 1: Email Address */}
                <div className="text-left">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    电子邮箱地址
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      required
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="您的电子邮箱地址"
                      disabled={loading}
                      className="w-full text-left px-4 h-11 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Field 2: Code / Password with Integrated helper */}
                <div className="text-left">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      验证码
                    </label>
                    
                    {/* Send / Click handler right-aligned */}
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={loading || isCounting || !isEmailValid}
                      className={`text-[11.5px] font-bold cursor-pointer transition-all duration-150 select-none ${
                        isCounting 
                          ? 'text-slate-400 cursor-not-allowed'
                          : isEmailValid 
                          ? 'text-indigo-600 hover:text-indigo-800 underline decor' 
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {loading && !isCounting ? (
                        <span className="inline-block w-3 h-3 border border-slate-400 border-t-transparent animate-spin rounded-full" />
                      ) : isCounting ? (
                        `${countdown}秒后可重获`
                      ) : (
                        '获取验证码'
                      )}
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={4}
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, ''));
                      if (error) setError('');
                    }}
                    placeholder="您的天命验证密匙（4位数字）"
                    disabled={loading}
                    className="w-full text-left px-4 h-11 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-mono tracking-wider placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all shadow-inner"
                  />
                </div>

                {/* In-App code simulation alert panel tailored for the light aesthetic */}
                {isCounting && (
                  <div className="mt-2 text-left">
                    {provider === 'smtp' ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200/50 rounded-xl text-[11px] text-slate-600 leading-relaxed shadow-sm">
                        <span className="text-emerald-700 font-bold block mb-0.5 flex items-center gap-1">
                          ✨ 密匙信件已成功飞往您的邮箱
                        </span>
                        星辰密报传送中，请查看 <strong className="text-slate-800 underline">{email}</strong> 的收件信箱及垃圾箱。
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-[11px] text-slate-600 leading-relaxed shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-1 text-amber-800 font-bold mb-1.5 justify-between">
                          <span className="flex items-center gap-1 text-[10px]">📬 虚拟星轨信函收信阁</span>
                          <span className="text-[8px] font-mono font-bold bg-amber-200/65 text-amber-800 px-1 py-0.2 rounded uppercase tracking-wider">星轨沙盘</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">当前未检测到 SMTP 设置，系统已映射虚拟信件缓存：</p>
                        
                        <div className="bg-white rounded-lg p-2 border border-amber-200/60 mb-1.5 font-mono text-[10.5px]">
                          <div className="text-amber-700/60 pb-1 border-b border-amber-100 flex justify-between select-none">
                            <span>To: {email}</span>
                            <span>{new Date().toLocaleTimeString()}</span>
                          </div>
                          <div className="text-slate-700 font-sans font-medium py-1">
                            主题: 🔮 您的天人共振星轨密匙
                          </div>
                          <div className="text-amber-600 font-bold text-center flex items-center justify-center gap-2 mt-1">
                            <span>验证码:</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                setVerificationCode(generatedCode);
                                setError('');
                              }} 
                              className="px-2 py-0.5 rounded bg-amber-100/80 hover:bg-amber-100 hover:text-amber-900 text-amber-800 border border-amber-300 font-mono text-[11px] cursor-pointer shadow-sm transition-all duration-150 font-extrabold active:scale-95"
                            >
                              一键填入: {generatedCode}
                            </button>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">
                          * 提示：需要发信可在 applet 的 Secrets 面板内填入 SMTP_USER / SMTP_PASS。
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Simulated Forget Password link inside the layout */}
                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => {
                      if (email) {
                        handleSendCode();
                      } else {
                        setError('请输入您的电子邮箱地址以重发验证码');
                      }
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer tracking-normal select-none"
                  >
                    无法收到验证码？
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <p className="text-xs text-red-600 font-medium px-1 flex items-start gap-1 text-left">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                    <span>{error}</span>
                  </p>
                )}

                {/* High quality consent terms checkbox matches standard layout */}
                <div 
                  className={`flex items-start gap-2 pt-1 select-none duration-150 text-left ${
                    shakeConsent ? 'animate-[shake_0.4s_ease-in-out] bg-red-50 p-1.5 rounded border border-red-200' : ''
                  }`}
                >
                  <label className="flex items-center relative cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={isAgreed}
                      onChange={(e) => {
                        setIsAgreed(e.target.checked);
                        if (e.target.checked && error.includes('协议')) setError('');
                      }}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded bg-slate-50 border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                    />
                    <div className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Check className="w-2.5 h-2.5 text-white font-black" />
                    </div>
                  </label>
                  
                  <span className="text-[11.5px] text-slate-500 leading-normal">
                    我已阅读并同意占星殿的{' '}
                    <button
                      type="button"
                      onClick={() => setActivePolicy('user')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                    >
                      《用户使用协议》
                    </button>{' '}
                    和{' '}
                    <button
                      type="button"
                      onClick={() => setActivePolicy('privacy')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                    >
                      《隐私权保护政策》
                    </button>
                  </span>
                </div>

                {/* REAL REGISTER / LOGIN DEEP PURPLE PRIMARY BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-11 text-white font-semibold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] duration-100 ${
                    isFormFilled
                      ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md transform hover:-translate-y-0.25'
                      : 'bg-indigo-400/50 text-white/80 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{isSignUp ? '注册' : '登录'}</span>
                  )}
                </button>
              </form>

            </div>

            {/* Bottom Register Option Link "没有账号？ 注册" / "已有账号？ 登录" (conditioned correctly) */}
            <div className="text-center text-[13px] text-slate-500 font-medium border-t border-slate-100 pt-4 mt-5">
              {isSignUp ? (
                <>
                  无需注册？直接返回{' '}
                  <button
                    onClick={() => {
                      setIsSignUp(false);
                      setError('');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer hover:underline"
                  >
                    进行登录
                  </button>
                </>
              ) : (
                <>
                  没有账号？{' '}
                  <button
                    onClick={() => {
                      setIsSignUp(true);
                      setError('');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer hover:underline"
                  >
                    注册
                  </button>
                </>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}

      {/* OVERLAY: GOOGLE & FACEBOOK SOCIAL ACCOUNT INSTANT AUTH SIMULATORS */}
      <AnimatePresence>
        {socialPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-x1 w-full max-w-[360px] overflow-hidden p-6 shadow-2xl relative rounded-2xl"
            >
              {/* Colored top bar for brand styling */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] ${socialPicker === 'google' ? 'bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500' : 'bg-[#1877F2]'}`} />
              
              <button
                onClick={() => setSocialPicker(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mt-2 mb-5">
                {socialPicker === 'google' ? (
                  <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                <h3 className="text-sm font-bold text-slate-800 font-sans mt-2">
                  选择您在 {socialPicker === 'google' ? 'Google' : 'Facebook'} 的授权账号
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">授权并登录到 MysticPalm 占星殿</p>
              </div>

              <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
                
                {/* Account 1: Checked user's address */}
                <button
                  onClick={() => triggerSocialLoginSimulated('leogo0626@gmail.com')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 transition-all flex items-center gap-3 text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    L
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-950 transition-colors">Leo</p>
                    <p className="text-[10px] text-slate-500 truncate">leogo0626@gmail.com</p>
                  </div>
                  <span className="text-[9px] text-indigo-600 bg-indigo-55 font-mono font-bold uppercase select-none tracking-wide bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    活动
                  </span>
                </button>

                {/* Account 2: Sample traveler */}
                <button
                  onClick={() => triggerSocialLoginSimulated('cosmic.traveler@gmail.com')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/60 border border-slate-100 hover:border-slate-200 transition-all flex items-center gap-3 text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs border border-purple-200">
                    🌌
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Cosmic Traveler</p>
                    <p className="text-[10px] text-slate-500 truncate">cosmic.traveler@gmail.com</p>
                  </div>
                </button>

              </div>

              <div className="text-[9.5px] text-slate-400 leading-normal border-t border-slate-100 pt-3">
                授权即代表您准许其第三方服务商将您的姓名、电子邮箱照片及公开资料与 <strong className="text-slate-700">MysticPalm</strong> 进行极速绑定与同步。
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: PRIVACY & USER TERM FULL CONTRACT VIEWER */}
      <AnimatePresence>
        {activePolicy && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-2xl w-full max-w-[420px] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-900 tracking-wider flex items-center gap-1.5 select-none font-sans">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {activePolicy === 'user' ? '用户使用协议' : '隐私权保护政策'}
                </span>
                <button
                  onClick={() => setActivePolicy(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable contract window */}
              <div className="p-6 overflow-y-auto text-slate-600 text-xs space-y-4 leading-relaxed font-sans max-h-[50vh] scrollbar-thin">
                {activePolicy === 'user' ? (
                  <>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">一、契约缔结说明</h4>
                    <p>欢迎来到 MysticPalm 占星殿（“本平台”）。当您使用邮箱验证、Google 快捷方式登入即代表您已完整审阅本指南。本系统之掌析星盘功能使用尖端 AI 算力计算推衍，其数据仅代表虚拟信息投影不替代具体法律与医疗策略建议。</p>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">二、数据上传与使用限制</h4>
                    <p>您仅可上传您自身获得合法知情同意之掌纹样本或辅助星盘参数。严禁利用本工具上传包含血腥、违法违法或涉嫌侵犯第三人合法肖像物权隐私之图像标本，后台探测核验将实行实时拦截并中止账户服务。</p>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">三、因果责任宣告</h4>
                    <p>本平台提倡理性认知。对于因参考人工智能预测而招致的商业决断偏差、偶发运势干扰及情感流向改变等物理行为后果，占星殿与技术承建方均不承担额外损害赔偿补偿等义务，祈请理性对待天命之昭示。</p>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">一、您的信息安全是我们的生命线</h4>
                    <p>我们绝非法窃取、购买、倾销任何使用者的敏感私人密码资料。为了保存您独一无二的历史命运日志及推衍轨迹，我们使用强加密安全连接存储您绑定的唯一电子邮箱及必要的用户名参数。</p>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">二、掌纹图像的处理机制</h4>
                    <p>当您启动天命洞悉或高维识图功能，上传的掌指原图在完成边缘纹路（生命线、智慧线等）量化算力转换并生产报告后，服务器一律实行阅后即焚原则释放，绝不在非受限公有云池内保留任何未经转译之生物图档。</p>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">三、快捷解绑及账户终死宣告</h4>
                    <p>在本平台，您拥有一切自主处理掌控权。随时能够在主面板或向司祭神职信函申请“完全消除账号档案”，这将会把保存在星罗云网库内所有您的邮箱归宿、掌纹报告和宿命记录进行不可撤修级彻底销毁抹去。</p>
                  </>
                )}
              </div>

              {/* Bottom agreement check box helper inside policy modal view */}
              <div className="p-4.5 border-t border-slate-100 bg-slate-50 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsAgreed(true);
                    setActivePolicy(null);
                    if (error.includes('协议')) setError('');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  我已知晓并同意协议条款
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
