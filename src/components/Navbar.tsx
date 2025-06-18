
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Login } from './auth/Login';
import { SignUp } from './auth/SignUp';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const { cartItems } = useCart();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Threadx
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors px-3 py-2 rounded-md ${
                isActive('/') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`font-medium transition-colors px-3 py-2 rounded-md ${
                isActive('/products') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Products
            </Link>
            
            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">
                    {currentUser.email?.split('@')[0]}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/history')}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    History
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-700 hover:text-blue-600"
                      >
                        <User size={18} className="mr-2" />
                        Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <Login onLoginSuccess={() => setIsLoginOpen(false)} />
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                      >
                        Sign Up
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <SignUp onSignUpSuccess={() => setIsSignUpOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            
            <Link 
              to="/cart" 
              className="relative p-3 text-gray-700 hover:text-blue-600 transition-colors hover:bg-gray-50 rounded-md"
            >
              <ShoppingCart size={24} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium shadow-md">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <Link to="/" className="text-2xl font-bold text-gray-900" onClick={() => setIsMenuOpen(false)}>
                Threadx
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col p-4 space-y-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-md ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`px-4 py-2 rounded-md ${isActive('/products') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/cart"
                className={`px-4 py-2 rounded-md ${isActive('/cart') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Cart
              </Link>
              
              {currentUser ? (
                <>
                  <Link
                    to="/history"
                    className={`px-4 py-2 rounded-md ${isActive('/history') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    History
                  </Link>
                  <Link
                    to="/profile"
                    className={`px-4 py-2 rounded-md ${isActive('/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                    <DialogTrigger asChild>
                      <button className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                        <User size={18} className="mr-2" />
                        Login
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <Login onLoginSuccess={() => {
                        setIsLoginOpen(false);
                        setIsMenuOpen(false);
                      }} />
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                    <DialogTrigger asChild>
                      <button className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md">
                        Sign Up
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <SignUp onSignUpSuccess={() => {
                        setIsSignUpOpen(false);
                        setIsMenuOpen(false);
                      }} />
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
