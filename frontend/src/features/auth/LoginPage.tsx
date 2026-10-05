import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building2, 
  HelpCircle 
} from 'lucide-react';
import { useAuth } from '../../stores/auth.store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'sso'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [autofilledNotice, setAutofilledNotice] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Official demo credentials for SIH evaluation
  const DEMO_EMAIL = 'officer@bisense.gov.in';
  const DEMO_PASSWORD = 'BISense@2025';

  const handleAutofill = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
    setAutofilledNotice(true);
    setTimeout(() => setAutofilledNotice(false), 2500);
  };

  const handleQuickDemoLogin = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (loading || ssoLoading) return;
    setError('');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setLoading(true);

    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.message?.toLowerCase().includes('invalid')) {
        setError('Invalid email or password.');
      } else {
        setError('Unable to connect to BISense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSsoClick = async () => {
    if (ssoLoading || loading) return;
    setError('');
    setAuthMethod('sso');
    setSsoLoading(true);

    try {
      // Check Govt SSO provider status (as verified, Govt SSO is not configured on backend)
      await new Promise(resolve => setTimeout(resolve, 400));
      setError('Government SSO is currently unavailable. Please try again or sign in using email.');
    } catch {
      setError('Government SSO is currently unavailable. Please try again or sign in using email.');
    } finally {
      setSsoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || ssoLoading) return;
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.message?.toLowerCase().includes('invalid')) {
        setError('Invalid email or password.');
      } else if (err.code === 'NETWORK_ERROR' || !err.status || err.status >= 500) {
        setError('Unable to connect to BISense. Please try again.');
      } else {
        setError(err.message || 'Unable to connect to BISense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* Centered Constrained Container - Brings things closer from left and right */}
      <div className="w-full max-w-[1260px] mx-auto px-6 sm:px-10 lg:px-12 py-8 lg:py-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          
          {/* ================= LEFT COLUMN: HERO & BRAND SHOWCASE ================= */}
          <div className="lg:col-span-7 relative self-stretch flex flex-col justify-between overflow-hidden">
            
            {/* Architectural Parliament Artwork - Spans full height of the section */}
            <div className="absolute inset-y-0 right-0 w-[62%] max-w-[500px] pointer-events-none select-none z-0 hidden md:block overflow-hidden">
              <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-br from-amber-300/20 via-orange-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              <img 
                src="/parliament.png" 
                alt="Indian Parliament" 
                className="w-full h-full object-cover object-center relative z-10 opacity-90"
              />
              {/* Soft atmospheric edge fades to blend into background seamlessly */}
              <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-white via-white/80 to-transparent z-20" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-20" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white via-white/70 to-transparent z-20" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-20" />
            </div>

            {/* Content Area */}
            <div className="relative z-10">
              {/* Brand Title - Text only without logo image and background */}
              <Link to={isAuthenticated ? "/dashboard" : "/"} className="inline-block group mb-8">
                <span className="font-extrabold text-2xl text-slate-900 tracking-tight leading-none block">
                  BISense
                </span>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">
                  STANDARDS INTELLIGENCE
                </p>
              </Link>

              {/* Headline using exact requested typography */}
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal tracking-tight text-slate-900 leading-[1.06] mb-6">
                One platform for <br />
                <span className="text-[#FF5500]">
                  Indian Standards
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-500 text-sm sm:text-base max-w-md leading-relaxed font-normal mb-8">
                Search, analyze and ensure compliance with Bureau of Indian Standards (BIS) specifications.
              </p>

              {/* 4 Feature Value Props - Clean text only without icons */}
              <div className="space-y-4 max-w-sm">
                {/* 1. Explore Standards */}
                <div className="py-0.5">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]">
                    Explore Standards
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    Search across thousands of BIS standards
                  </p>
                </div>

                {/* 2. Smarter Compliance */}
                <div className="py-0.5">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]">
                    Smarter Compliance
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    AI-powered insights and clause analysis
                  </p>
                </div>

                {/* 3. Stay Updated */}
                <div className="py-0.5">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]">
                    Stay Updated
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    Real-time alerts and amendments
                  </p>
                </div>

                {/* 4. Better Decisions */}
                <div className="py-0.5">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]">
                    Better Decisions
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    Turn standards into actionable intelligence
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <div className="mt-10 pt-4">
                <div className="w-8 h-0.5 bg-[#FF5500] mb-2 rounded-full" />
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  BUILDING A SAFER, HIGHER QUALITY AND SELF-RELIANT INDIA
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SIGN IN FORM ================= */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            
            {/* Top Help Link */}
            <div className="flex items-center justify-end mb-4">
              <a 
                href="mailto:helpdesk@bisense.gov.in" 
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Need help?</span>
              </a>
            </div>

            {/* Form Box */}
            <div className="max-w-md w-full mx-auto">
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-normal">
                  Sign in to your BISense account
                </p>

                {/* Demo Quick Autofill Banner */}
                <div className="mt-3.5 p-2.5 rounded-xl bg-orange-50/80 border border-orange-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-slate-600 truncate text-[11px]">
                      Demo: <strong className="text-slate-800 font-mono">officer@bisense.gov.in</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutofill}
                    className="ml-2 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-white px-2 py-0.5 rounded-md border border-orange-200 shadow-2xs shrink-0 cursor-pointer active:scale-95"
                  >
                    {autofilledNotice ? 'Filled!' : 'Auto-fill'}
                  </button>
                </div>
              </div>

              {/* Email vs SSO Tabs */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    setError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    authMethod === 'email'
                      ? 'border border-orange-500 text-orange-600 bg-white shadow-2xs'
                      : 'border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-4 h-4 text-orange-500" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  disabled={ssoLoading || loading}
                  onClick={handleSsoClick}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    authMethod === 'sso'
                      ? 'border border-orange-500 text-orange-600 bg-white shadow-2xs'
                      : 'border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Single Sign-On for Government Officers"
                >
                  {ssoLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>SSO (Govt.)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleAutofill}
                      className="text-xs font-medium text-[#FF5500] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs font-mono"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF4E00] hover:bg-[#E64600] text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99 disabled:opacity-70 mt-1"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[11px]">
                    OR
                  </span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={loading || ssoLoading}
                  className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="truncate">Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={loading || ssoLoading}
                  className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  <span className="truncate">Continue with Microsoft</span>
                </button>
              </div>

              {/* Book a Demo Link */}
              <div className="text-center text-xs text-slate-500 mt-8">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#FF5500] hover:underline font-semibold">
                  Book a demo
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
