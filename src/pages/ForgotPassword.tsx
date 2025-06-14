
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get the base URL for WordPress from environment variables
      const baseUrl = import.meta.env.VITE_WC_BASE_URL?.replace('/wp-json/wc/v3', '') || 
                     'https://localhost/threadx/threadxwp';
      
      // WordPress password reset endpoint
      const resetUrl = `${baseUrl}/wp-json/bdpwr/v1/reset-password`;
      
      console.log('Sending password reset request to:', resetUrl);
      
      const response = await axios.post(resetUrl, {
        email: email,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('Password reset response:', response.data);
      
      if (response.data && (response.data.success || response.data.message)) {
        setIsSubmitted(true);
        toast.success('Password reset instructions sent to your email');
      } else {
        throw new Error('Unexpected response format');
      }
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 404) {
        // Try alternative WordPress password reset endpoint
        try {
          const altBaseUrl = import.meta.env.VITE_WC_BASE_URL?.replace('/wp-json/wc/v3', '') || 
                            'https://localhost/threadx/threadxwp';
          
          const altResetUrl = `${altBaseUrl}/wp-login.php?action=lostpassword`;
          
          // Create a form submission to WordPress native password reset
          const formData = new FormData();
          formData.append('user_login', email);
          formData.append('wp-submit', 'Get New Password');
          
          await axios.post(altResetUrl, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 10000,
          });
          
          setIsSubmitted(true);
          toast.success('Password reset instructions sent to your email');
          
        } catch (altError) {
          console.error('Alternative password reset failed:', altError);
          toast.error('Failed to send reset email. Please check your email address and try again.');
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to send reset email. Please check your email address and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full"
                >
                  Try Different Email
                </Button>
                <Link to="/login">
                  <Button className="w-full bg-black text-white hover:bg-gray-800">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardHeader>
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Your Password
            </CardTitle>
            <p className="text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
