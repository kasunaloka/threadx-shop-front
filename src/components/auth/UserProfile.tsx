import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWordPressUser } from '../../hooks/useWordPressApi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';

export function UserProfile() {
  const { currentUser, logout } = useAuth();
  const { createUser, getUserProfile } = useWordPressUser();
  const [wordpressUser, setWordpressUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadWordPressUser();
    }
  }, [currentUser]);

  const loadWordPressUser = async () => {
    try {
      setLoading(true);
      setError('');
      const profile = await getUserProfile();
      setWordpressUser(profile);
    } catch (error) {
      console.error('Failed to load WordPress user:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWordPressUser = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await createUser();
      setWordpressUser(result);
    } catch (error) {
      console.error('Failed to create WordPress user:', error);
      setError('Failed to create WordPress user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser.photoURL || undefined} />
              <AvatarFallback>
                {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {currentUser.displayName || 'User'}
              </CardTitle>
              <CardDescription>{currentUser.email}</CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">Firebase User</Badge>
                {wordpressUser && (
                  <Badge variant="outline">WordPress User</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                Firebase Information
              </h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">UID:</span> {currentUser.uid}</p>
                <p><span className="font-medium">Email:</span> {currentUser.email}</p>
                <p><span className="font-medium">Email Verified:</span> {currentUser.emailVerified ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">Provider:</span> {currentUser.providerData[0]?.providerId}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                WordPress Information
              </h3>
              <div className="mt-2">
                {wordpressUser ? (
                  <div className="space-y-2">
                    <p><span className="font-medium">WordPress ID:</span> {wordpressUser.user_id}</p>
                    <p><span className="font-medium">Status:</span> {wordpressUser.message}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-500">No WordPress user linked</p>
                    <Button 
                      onClick={handleCreateWordPressUser}
                      disabled={loading}
                      size="sm"
                    >
                      {loading ? 'Creating...' : 'Link to WordPress'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                Account Actions
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your account and authentication
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              disabled={loading}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 