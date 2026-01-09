import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
}

const mockUser: User = {
  email: 'test@example.com',
};

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simule un chargement d'auth
    setTimeout(() => {
      setUser(mockUser); // 👈 injecte un faux utilisateur
      setLoading(false);
    }, 500); // 0.5s de chargement
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);