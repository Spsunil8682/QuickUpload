import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from 'next/router';

type User = {
  _id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    // Simulate a loading delay to allow the home page to render
    setTimeout(() => {
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        if (!["/","/login", "/signup" ,"/verify-email"].includes(router.pathname)) {
          router.push("/login");
        }
      }
      setIsLoading(false);
    }, 300); // Adjust the delay time as needed
  }, [router]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
