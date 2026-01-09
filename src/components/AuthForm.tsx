import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthFormProps {
  onSubmit: (email: string, password: string) => Promise<{ error: Error | null }>;
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
  isLoading: boolean;
}

export function AuthForm({ onSubmit, mode, onToggleMode, isLoading }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('[AuthForm] Form submitted, mode:', mode);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    console.log('[AuthForm] Calling onSubmit...');
    const { error: authError } = await onSubmit(email, password);

    if (authError) {
      console.error('[AuthForm] Auth error received:', authError.message);
      setError(authError.message);
    } else {
      console.log('[AuthForm] Auth successful, waiting for redirect...');
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          required
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />
        {isSignUp && (
          <p className="mt-1 text-xs text-slate-500">Must be at least 6 characters</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        {isLoading ? (
          'Loading...'
        ) : (
          <>
            {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onToggleMode}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          {isSignUp ? (
            <>
              Already have an account? <span className="font-semibold text-emerald-600">Sign in</span>
            </>
          ) : (
            <>
              Don't have an account? <span className="font-semibold text-emerald-600">Sign up</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
