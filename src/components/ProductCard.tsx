
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0],
      color: product.colors[0],
      quantity: 1,
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-lg text-black mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3">{product.category}</p>
          <p className="text-2xl font-bold text-black mb-4">${product.price}</p>
        </div>
      </Link>
      <div className="px-6 pb-6">
        <button
          onClick={handleAddToCart}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
