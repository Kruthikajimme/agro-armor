import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { authApi } from '../Backend/api/todoApi';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import signupBg from '@/assets/auth-bg-sunset.png';
import { Eye, EyeOff, Phone, Mail, User, Lock, ArrowRight, Leaf, ShieldAlert } from 'lucide-react';
import { trackEvent, identifyUser } from '@/lib/mixpanel';
import { trackAmplitudeEvent, identifyAmplitudeUser } from '@/lib/amplitude';
import { trackSignUp, trackLogin } from '@/lib/analytics';

interface AuthFormProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    try {
      const response = await authApi.register(phone, password, name, email);
      
      // Track Registration Event
      trackEvent('Registration Success', {
        'Name': name,
        'Phone': phone,
        'Email': email
      });
      identifyUser(phone, {
        '$name': name,
        '$email': email,
        'Phone': phone,
        '$created': new Date().toISOString()
      });
      
      // Track Amplitude Registration Event
      trackAmplitudeEvent('Registration Success', {
        'Name': name,
        'Phone': phone,
        'Email': email
      });
      identifyAmplitudeUser(phone, {
        'name': name,
        'email': email,
        'phone': phone,
      });

      // Track GA4 Signup (Strictly without PII)
      trackSignUp('credentials');

      onAuthSuccess(response.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    try {
      const response = await authApi.login(phone, password, email);
      
      // Track Login Event
      trackEvent('Login Success', {
        'Phone': phone,
        'Email': email
      });
      identifyUser(phone, {
        '$email': email,
        '$last_login': new Date().toISOString()
      });
      
      // Track Amplitude Login Event
      trackAmplitudeEvent('Login Success', {
        'Phone': phone,
        'Email': email
      });
      identifyAmplitudeUser(phone, {
        'email': email,
      });

      // Track GA4 Login (Strictly without PII)
      trackLogin('credentials');

      onAuthSuccess(response.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* ── Full-screen background image ── */}
      <img
        src={signupBg}
        alt="AgroArmor background"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105"
      />
      {/* Light overlay for better text contrast */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

      {/* ── Top bar (logo + language) ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 hidden md:flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-black tracking-tight drop-shadow">AgroArmor</span>
        </div>
        <LanguageSelector />
      </div>

      {/* ── Glassmorphism Card ── */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.22)',
          }}
        >
          {/* Card header */}
          <div className="px-8 pt-8 pb-5 text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-1 drop-shadow-sm">
              {mode === 'login' ? t('loginTab') : t('registerTab')}
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              {mode === 'login'
                ? t('authSubtitle')
                : t('authSubtitle')}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="px-8 pb-4">
            <div className="flex rounded-2xl p-1" style={{ background: 'rgba(0,0,0,0.25)' }}>
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setMode(tab); setError(''); setShowPassword(false); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    mode === tab
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div className="px-8 pb-8">
            {/* Error handling */}
            {error && (
              <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-100 shadow-lg shadow-red-950/20">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold leading-none">
                      {error.includes('fetch') || error.includes('NetworkError') 
                        ? 'Backend Server Connection Error' 
                        : 'Something went wrong'}
                    </p>
                    <p className="text-xs text-red-200/70 leading-relaxed">
                      {error.includes('fetch') 
                        ? 'We are unable to reach the AgroArmor server. Please ensure the backend is running and you have an active internet connection.' 
                        : error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mode === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-bold uppercase tracking-wide">{t('nameLabel')}</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="name" type="text" required placeholder={t('namePlaceholder')}
                      disabled={isLoading}
                      className="pl-10 h-11 rounded-xl text-slate-900 placeholder-slate-400 border-slate-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-0 shadow-sm"
                    />
                  </div>
                </div>
                {/* Email */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-bold uppercase tracking-wide">{t('emailLabel')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="email" type="email" required placeholder={t('emailPlaceholder')}
                      disabled={isLoading}
                      className="pl-10 h-11 rounded-xl text-slate-900 placeholder-slate-400 border-slate-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-0 shadow-sm"
                    />
                  </div>
                </div>
                {/* Phone */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-bold uppercase tracking-wide">{t('phoneLabel')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="phone" type="tel" required placeholder={t('phonePlaceholder')}
                      disabled={isLoading}
                      className="pl-10 h-11 rounded-xl text-slate-900 placeholder-slate-400 border-slate-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-0 shadow-sm"
                    />
                  </div>
                </div>
                {/* Password */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-bold uppercase tracking-wide">{t('passwordLabel')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="password" type={showPassword ? 'text' : 'password'} required placeholder={t('passwordPlaceholder')}
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 rounded-xl text-slate-900 placeholder-slate-400 border-slate-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-0 shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 mt-1 transition-all">
                  {isLoading
                    ? <><span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> {t('creatingAccount')}</>
                    : <> {t('createAccountAction')} <ArrowRight className="w-4 h-4" /></>
                  }
                </Button>

                <p className="text-center text-sm text-slate-500 pt-1 font-medium">
                  {t('haveAccount')}{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(''); }}
                    className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                    {t('loginTab')}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3.5">
                {/* Email */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-bold uppercase tracking-wide">{t('emailLabel')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="email" type="email" required placeholder={t('emailPlaceholder')}
                      disabled={isLoading}
                      className="pl-10 h-11 rounded-xl text-slate-900 placeholder-slate-400 border-slate-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-0 shadow-sm"
                    />
                  </div>
                </div>
                {/* Phone */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-bold uppercase tracking-wide">{t('phoneLabel')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="phone" type="tel" required placeholder={t('phonePlaceholder')}
                      disabled={isLoading}
                      className="pl-10 h-11 rounded-xl text-slate-900 placeholder-slate-400 border-slate-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-0 shadow-sm"
                    />
                  </div>
                </div>
                {/* Password */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-bold uppercase tracking-wide">{t('passwordLabel')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="password" type={showPassword ? 'text' : 'password'} required placeholder={t('passwordPlaceholder')}
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 rounded-xl text-slate-900 placeholder-slate-400 border-slate-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-0 shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 mt-1 transition-all">
                  {isLoading
                    ? <><span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> {t('signingIn')}</>
                    : <> {t('signInAction')} <ArrowRight className="w-4 h-4" /></>
                  }
                </Button>

                <p className="text-center text-sm text-slate-500 pt-1 font-medium">
                  {t('noAccount')}{' '}
                  <button type="button" onClick={() => { setMode('register'); setError(''); }}
                    className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                    {t('registerTab')}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-5 font-medium">
          &copy; {new Date().getFullYear()} AgroArmor · Built for Indian farmers with ❤️
        </p>
      </div>
    </div>
  );
};
