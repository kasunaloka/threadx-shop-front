
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

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
            
            {/* Authentication Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/orders" 
                  className={`font-medium transition-colors px-3 py-2 rounded-md ${
                    isActive('/orders') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Orders
                </Link>
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">
                    {user?.displayName || user?.username || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors px-3 py-2 rounded-md hover:bg-red-50"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className={`font-medium transition-colors px-4 py-2 rounded-md border ${
                  isActive('/login') 
                    ? 'text-blue-600 border-blue-600 bg-blue-50' 
                    : 'text-gray-700 border-gray-300 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                Login
              </Link>
            )}
            
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
          <div className="md:hidden py-4 border-t border-gray-100 bg-white">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className={`font-medium px-3 py-2 rounded-md transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className={`font-medium px-3 py-2 rounded-md transition-colors ${
                  isActive('/products') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/orders" 
                    className={`font-medium px-3 py-2 rounded-md transition-colors ${
                      isActive('/orders') 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <div className="flex items-center space-x-2 text-gray-700 px-3 py-2 bg-gray-50 rounded-md mx-0">
                    <User size={16} />
                    <span className="text-sm font-medium">
                      {user?.displayName || user?.username || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 font-medium px-3 py-2 rounded-md hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className={`font-medium px-3 py-2 rounded-md border transition-colors ${
                    isActive('/login') 
                      ? 'text-blue-600 border-blue-600 bg-blue-50' 
                      : 'text-gray-700 border-gray-300 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
              
              <Link 
                to="/cart" 
                className="flex items-center text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart size={20} className="mr-2" />
                Cart ({cartItemsCount})
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
