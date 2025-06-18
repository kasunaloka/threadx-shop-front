import React from 'react';
import { Profile } from '../components/auth/Profile';
import { AuthGuard } from '../components/auth/AuthGuard';

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto">
        <AuthGuard>
          <Profile />
        </AuthGuard>
      </div>
    </div>
  );
}