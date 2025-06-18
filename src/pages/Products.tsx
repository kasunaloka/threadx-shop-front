
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/FilterPanel';
import { useProducts } from '../hooks/useProducts';

const Products = () => {
  const [filters, setFilters] = useState({
    category: '',
    size: '',
    color: '',
    priceRange: null as [number, number] | null,
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const { products, loading, error } = useProducts({
    category: filters.category || undefined,
    orderby: sortBy,
    order: sortOrder,
    minPrice: filters.priceRange?.[0],
    maxPrice: filters.priceRange?.[1],
  });

  // Filter products client-side for size and color (if not handled by WooCommerce)
  const filteredProducts = products.filter(product => {
    if (filters.size && filters.size !== 'all' && !product.sizes.includes(filters.size)) {
      return false;
    }
    if (filters.color && filters.color !== 'all' && !product.colors.some(color => 
      color.toLowerCase().includes(filters.color.toLowerCase())
    )) {
      return false;
    }
    return true;
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
    switch (sortOption) {
      case 'price-low':
        setSortBy('price');
        setSortOrder('asc');
        break;
      case 'price-high':
        setSortBy('price');
        setSortOrder('desc');
        break;
      case 'name':
        setSortBy('title');
        setSortOrder('asc');
        break;
      default:
        setSortBy('date');
        setSortOrder('desc');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">Our Products</h1>
          <p className="text-gray-600">Discover our complete collection of premium shirts</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Panel */}
          <div className="lg:w-1/4">
            <FilterPanel onFilterChange={handleFilterChange} />
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Sort Options */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading products...' : `Showing ${filteredProducts.length} products`}
              </p>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Newest First</option>
                <option value="title-asc">Name A-Z</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-gray-200 animate-pulse rounded-xl h-96"></div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Products;
