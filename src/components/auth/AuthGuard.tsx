import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Login } from './Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return <>{children}</>;
}
