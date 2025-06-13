
import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-blue-50 to-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-black mb-6">
              Premium Shirts
              <span className="block text-blue-600">for Every Style</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover our collection of premium quality shirts designed for comfort, style, and versatility. Perfect for any occasion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/products"
                className="bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center"
              >
                Shop Now
              </Link>
              <Link
                to="/products"
                className="border-2 border-black text-black px-8 py-4 rounded-lg font-semibold hover:bg-black hover:text-white transition-colors text-center"
              >
                View Collection
              </Link>
            </div>
          </div>
          <div className="lg:justify-self-end">
            <img
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center"
              alt="Premium Shirt Collection"
              className="w-full max-w-md rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
