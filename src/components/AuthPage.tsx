import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { TrendingUp } from 'lucide-react';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    console.log('[AuthPage] handleSubmit called, mode:', mode);
    setIsLoading(true);

    try {
      const result = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);

      console.log('[AuthPage] Auth result:', result.error ? 'error' : 'success');

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-emerald-100 p-3">
              <TrendingUp size={32} className="text-emerald-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
              {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-slate-600">
              {mode === 'signin'
                ? 'Sign in to access your MVP dashboard'
                : 'Create an account to start tracking your variants'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <AuthForm
              onSubmit={handleSubmit}
              mode={mode}
              onToggleMode={toggleMode}
              isLoading={isLoading}
            />
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Essentialist MVP Decision Dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
