import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMe, type Doctor, type Employee, type User as ApiUser } from '../lib/api';

// Expanded User type to include the full profile
export type User = ApiUser & { 
  branch?: { name: string; slug: string; };
  doctor?: Doctor;
  employee?: Employee;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, token: null, login: () => {}, logout: () => {}, isLoading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData as User);
        } catch (error) {
          console.error("Failed to fetch user profile, logging out.", error);
          localStorage.removeItem('admin_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    setIsLoading(true); // Start loading user profile
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
