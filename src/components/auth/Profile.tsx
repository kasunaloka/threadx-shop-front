import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { currentUser, logout, updateProfile, updateEmail, updatePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      // Update display name if changed
      if (displayName !== currentUser.displayName) {
        await updateProfile(displayName);
      }
      
      // Update email if changed
      if (email !== currentUser.email && currentPassword) {
        await updateEmail(email, currentPassword);
      }
      
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setError('Failed to update profile: ' + error.message);
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      await updatePassword(currentPassword, newPassword);
      
      setMessage('Password updated successfully!');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setError('Failed to update password: ' + error.message);
      console.error('Password update error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      await deleteAccount(currentPassword);
      
      navigate('/');
    } catch (error: any) {
      setError('Failed to delete account: ' + error.message);
      console.error('Account deletion error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            You need to be logged in to view your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>
          View and update your account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {message && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          {(email !== currentUser.email) && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password (required to change email)</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={email !== currentUser.email}
              />
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
        
        <Separator />
        
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowPasswordChange(!showPasswordChange)}
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </Button>
          
          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPasswordForChange">Current Password</Label>
                <Input
                  id="currentPasswordForChange"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
          
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={() => setShowDeleteAccount(!showDeleteAccount)}
          >
            {showDeleteAccount ? 'Cancel' : 'Delete Account'}
          </Button>
          
          {showDeleteAccount && (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPasswordForDelete">Current Password</Label>
                <Input
                  id="currentPasswordForDelete"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <Alert variant="destructive">
                <AlertDescription>
                  This action cannot be undone. All your data will be permanently deleted.
                </AlertDescription>
              </Alert>
              
              <Button type="submit" variant="destructive" className="w-full" disabled={loading}>
                {loading ? 'Deleting...' : 'Confirm Delete Account'}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => logout()}>
          Logout
        </Button>
      </CardFooter>
    </Card>
  );
}