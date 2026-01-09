import { useState, useRef } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DropdownMenu } from './DropdownMenu';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all sm:text-base"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User size={18} />
        <span>{user.email?.split('@')[0]}</span>
      </button>

      <DropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        trigger={buttonRef.current}
        minWidth={256}
        className="rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="border-b border-slate-100 p-3">
          <p className="text-xs text-slate-500">Signed in as</p>
          <p className="truncate text-sm font-medium text-slate-900">{user.email}</p>
        </div>

        <div className="p-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </DropdownMenu>
    </>
  );
}
