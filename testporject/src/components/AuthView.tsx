import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      setInviteToken(token);
      setIsLogin(false);
      // In a real app, we would fetch the invitation details here
      // For demo, we'll just show it's an invitation-based signup
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
          }
        });
        if (error) throw error;
        alert('Registration successful! Please check your email for confirmation.');
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0072c6] p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <span className="material-symbols-outlined text-[48px]">hub</span>
          </div>
          <h1 className="text-2xl font-semibold uppercase tracking-wider">UCI Dynamics 365</h1>
          <p className="text-blue-100 text-[13px] mt-2">Unified Client Interface Prototype</p>
        </div>
        
        <div className="p-8">
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              className={`flex-1 pb-3 text-[14px] font-medium transition-colors ${isLogin ? 'text-[#0072c6] border-b-2 border-[#0072c6]' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 pb-3 text-[14px] font-medium transition-colors ${!isLogin ? 'text-[#0072c6] border-b-2 border-[#0072c6]' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {inviteToken && !isLogin && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[13px] flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
              <div>
                <p className="font-semibold">Invitation Detected</p>
                <p className="opacity-80">You've been invited to join the team. Please complete your profile to continue.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-[13px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">person</span>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:border-[#0072c6] focus:ring-1 focus:ring-[#0072c6] outline-none text-[13px] transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">mail</span>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:border-[#0072c6] focus:ring-1 focus:ring-[#0072c6] outline-none text-[13px] transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">lock</span>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:border-[#0072c6] focus:ring-1 focus:ring-[#0072c6] outline-none text-[13px] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#0072c6] hover:bg-[#005a9e] text-white font-medium py-2.5 rounded transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">{isLogin ? 'login' : 'person_add'}</span>
                  {isLogin ? 'Sign In' : 'Register'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[12px] text-slate-500">
              Need help? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
