
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useProductHistory } from '../context/ProductHistoryContext';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToHistory } = useProductHistory();
  
  const productId = parseInt(id || '0');
  const { product, loading, error } = useProduct(productId);
  
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Memoize total price calculation
  const totalPrice = useMemo(() => {
    return product ? (product.price * quantity).toFixed(2) : '0.00';
  }, [product?.price, quantity]);

  // Set default selections when product loads
  React.useEffect(() => {
    if (product && !selectedSize && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    if (product && !selectedColor && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product, selectedSize, selectedColor]);

  // Add product to history when it loads
  React.useEffect(() => {
    if (product) {
      addToHistory(product);
    }
  }, [product, addToHistory]);

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
    });

    toast.success(`${product.name} added to cart!`);
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <Skeleton className="w-full aspect-square rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            {error || 'Product Not Found'}
          </h1>
          <p className="text-gray-600 mb-8">
            {error ? 'There was an error loading this product.' : 'The product you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/products')}
          className="text-blue-600 hover:text-blue-700 font-medium mb-8 flex items-center transition-colors"
        >
          ← Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl shadow-lg bg-gray-50">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">{product.category}</p>
              <p className="text-4xl font-bold text-black">${product.price}</p>
            </div>
            
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">Description</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Size
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-blue-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                        selectedColor === color
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-blue-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={product.stockQuantity !== undefined && quantity >= product.stockQuantity}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                product.inStock
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.inStock ? `Add to Cart - $${totalPrice}` : 'Out of Stock'}
            </button>

            {/* Product Info */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Availability:</span>
                <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              {product.stockQuantity !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Stock Quantity:</span>
                  <span className="text-gray-600">{product.stockQuantity} units</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
