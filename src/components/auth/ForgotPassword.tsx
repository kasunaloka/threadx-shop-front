import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface ForgotPasswordProps {
  onClose?: () => void;
}

export function ForgotPassword({ onClose }: ForgotPasswordProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalonePage = location.pathname === '/forgot-password';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      setError(
        error.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : 'Failed to send password reset email. ' + error.message
      );
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          {onClose && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2" 
              onClick={onClose}
            >
              Back to Login
            </Button>
          )}
          
          {isStandalonePage && message && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2" 
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}