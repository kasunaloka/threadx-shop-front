import React from 'react';
import { ForgotPassword } from '../components/auth/ForgotPassword';

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto">
        <ForgotPassword />
      </div>
    </div>
  );
}