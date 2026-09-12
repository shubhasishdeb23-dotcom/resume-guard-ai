import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mockUsers: Record<UserRole, User> = {
  candidate: {
    id: 'usr_candidate_001',
    email: 'candidate@example.com',
    name: 'Alex Johnson',
    role: 'candidate',
    createdAt: new Date('2024-01-15'),
  },
  recruiter: {
    id: 'usr_recruiter_001',
    email: 'recruiter@techcorp.com',
    name: 'Sarah Mitchell',
    role: 'recruiter',
    createdAt: new Date('2024-02-01'),
  },
  admin: {
    id: 'usr_admin_001',
    email: 'admin@resumequard.ai',
    name: 'System Admin',
    role: 'admin',
    createdAt: new Date('2023-12-01'),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);

  const login = useCallback((email: string, role: UserRole) => {
    const mockUser = mockUsers[role];
    setUser({ ...mockUser, email });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUser(mockUsers[role]);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
