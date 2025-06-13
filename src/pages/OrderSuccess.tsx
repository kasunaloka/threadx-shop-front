
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const OrderSuccess = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-black mb-4">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-black mb-4">What's Next?</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                <span className="text-gray-700">Order confirmation will be sent to your email</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                <span className="text-gray-700">Your order will be processed within 1-2 business days</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                <span className="text-gray-700">Tracking information will be provided once shipped</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Link
              to="/products"
              className="inline-block bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
            <br />
            <Link
              to="/"
              className="inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
