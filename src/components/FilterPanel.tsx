
import React, { useState } from 'react';

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    category: 'all',
    size: 'all',
    color: 'all',
    priceRange: [0, 200],
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      category: 'all',
      size: 'all',
      color: 'all',
      priceRange: [0, 200],
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Reset
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="business">Business</option>
          <option value="premium">Premium</option>
          <option value="summer">Summer</option>
        </select>
      </div>

      {/* Size Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Size</label>
        <select
          value={filters.size}
          onChange={(e) => handleFilterChange('size', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Sizes</option>
          <option value="S">Small</option>
          <option value="M">Medium</option>
          <option value="L">Large</option>
          <option value="XL">X-Large</option>
          <option value="XXL">XX-Large</option>
        </select>
      </div>

      {/* Color Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
        <select
          value={filters.color}
          onChange={(e) => handleFilterChange('color', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Colors</option>
          <option value="white">White</option>
          <option value="black">Black</option>
          <option value="blue">Blue</option>
          <option value="navy">Navy</option>
          <option value="gray">Gray</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
        </label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="200"
            value={filters.priceRange[0]}
            onChange={(e) => 
              handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])
            }
            className="w-full"
          />
          <input
            type="range"
            min="0"
            max="200"
            value={filters.priceRange[1]}
            onChange={(e) => 
              handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
