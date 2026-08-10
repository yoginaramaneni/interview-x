import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Toast, ToastContainer } from '../components/ui/Notification';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
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
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = useWatch({
    control,
    name: 'password',
  });

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, text: 'Medium', color: 'bg-amber-500' };
    return { score, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        full_name: data.name,
        role: 'candidate',
      });
      addToast('Account created successfully!', 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed. Please check details.';
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors">
      {/* Left side: Graphic Panel */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 dark:bg-slate-900/60 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-md w-full z-10 text-white flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-card border border-white/10 shadow-2xl flex flex-col gap-6">
            <h3 className="text-xl font-bold">Unlock Enterprise Mock Prep</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create an account to gain instant access to interactive ATS evaluation dashboards, circular progress stats, and suggested roadmaps.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-350">
                <CheckCircle className="w-4.5 h-4.5 text-blue-500" />
                <span>Unlimited mock technical voice sessions</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-350">
                <CheckCircle className="w-4.5 h-4.5 text-blue-500" />
                <span>Comprehensive logic & coding mock problems</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-350">
                <CheckCircle className="w-4.5 h-4.5 text-blue-500" />
                <span>Detailed PDF scorecard generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-xl font-bold text-blue-650 dark:text-blue-400">InterviewAI</span>
              <span className="text-[10px] uppercase font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded">X</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">Create an account</h2>
            <p className="text-xs text-slate-500 dark:text-slate-450">Get started on your interview preparation program.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="name"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />

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
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-550 dark:text-slate-400">
                    <span>Password Strength:</span>
                    <span>{strength.text}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === password || 'Passwords do not match',
              })}
            />

            <Button type="submit" isLoading={loading} className="w-full mt-3 h-[44px]">
              Register Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-505 dark:text-slate-450">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-650 dark:text-blue-400 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
