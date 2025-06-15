
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email or username.');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      await wooCommerceApi.requestPasswordReset(email);
      // To prevent user enumeration, we show a generic success message.
      setMessage('If an account with that email or username exists, a password reset link has been sent.');
      toast.success('Check your email for a reset link.');
      setEmail('');
    } catch (error: any) {
      // We show the same generic message even on error for security.
      // The actual error is logged to the console for debugging.
      setMessage('If an account with that email or username exists, a password reset link has been sent.');
      toast.error('Could not process request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Forgot Password?</h1>
            <p className="text-gray-600">Enter your email or username to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username or email"
                required
                disabled={isLoading}
              />
            </div>

            {message && (
              <p className="text-sm text-center text-gray-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
