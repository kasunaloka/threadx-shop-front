import React from 'react';
import { SignUp } from '../components/auth/SignUp';

export default function SignUpPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto">
        <SignUp />
      </div>
    </div>
  );
}