import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Eye, EyeOff, Mic, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Toast, ToastContainer } from '../components/ui/Notification';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await login({ email: data.email, password: data.password });
      addToast('Logged in successfully!', 'success');
      // Delay navigation slightly so they can see success toast
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to sign in. Please verify your credentials.';
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors">
      {/* Left side: Premium Mockup Graphic Panel */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 dark:bg-slate-900/60 items-center justify-center p-12 relative overflow-hidden">
        {/* Glowing background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/25 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-md w-full z-10">
          <div className="glass-panel p-8 rounded-card border border-white/10 text-white flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">InterviewAI X Simulator</span>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center min-h-[140px]">
              {/* Dynamic waveform simulation */}
              <div className="flex items-end gap-1.5 h-16">
                <div className="w-1.5 bg-blue-500 rounded-full animate-wave-1" style={{ height: '40%' }} />
                <div className="w-1.5 bg-blue-400 rounded-full animate-wave-2" style={{ height: '70%' }} />
                <div className="w-1.5 bg-blue-300 rounded-full animate-wave-3" style={{ height: '90%' }} />
                <div className="w-1.5 bg-blue-400 rounded-full animate-wave-4" style={{ height: '60%' }} />
                <div className="w-1.5 bg-blue-500 rounded-full animate-wave-5" style={{ height: '35%' }} />
              </div>
            </div>

            <div className="space-y-1 text-center">
              <p className="text-xs text-blue-200 uppercase tracking-widest font-bold">Status: Ready</p>
              <h3 className="text-base font-semibold text-white mt-1">Immersive AI Verbal Simulator</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect your microphone and speak naturally. Receive detailed diagnostic metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">InterviewAI</span>
              <span className="text-[10px] uppercase font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded">X</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your credentials to access your mock dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="name@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <div className="flex flex-col gap-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <div className="flex items-center justify-between text-xs mt-1">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    {...register('rememberMe')}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" isLoading={loading} className="w-full mt-2 h-[44px]">
              Sign In
            </Button>
          </form>

          {/* Social login UI-only */}
          <div className="flex flex-col gap-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 border-t border-slate-200 dark:border-slate-800" />
              <span className="relative px-3.5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-400 font-medium">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                leftIcon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                }
                onClick={() => navigate('/dashboard')}
                className="h-[44px]"
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                leftIcon={
                  <svg className="w-4 h-4 fill-current text-slate-905 dark:text-slate-100" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                }
                onClick={() => navigate('/dashboard')}
                className="h-[44px]"
              >
                GitHub
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-450 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-650 dark:text-blue-400 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
