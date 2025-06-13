
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeaturedProducts />
      <Footer />
    </div>
  );
};

export default Index;
