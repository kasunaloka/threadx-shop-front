import React from 'react';
import { Login } from '../components/auth/Login';

export default function LoginPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto">
        <Login />
      </div>
    </div>
  );
}