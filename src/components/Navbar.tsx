
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const location = useLocation();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-black">
            Threadx
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`font-medium transition-colors ${
                isActive('/products') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Products
            </Link>
            <Link 
              to="/login" 
              className={`font-medium transition-colors ${
                isActive('/login') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Login
            </Link>
            <Link 
              to="/cart" 
              className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ShoppingCart size={24} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium">Products</Link>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
              <Link to="/cart" className="flex items-center text-gray-700 hover:text-blue-600 font-medium">
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
