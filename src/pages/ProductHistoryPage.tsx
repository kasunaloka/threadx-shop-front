import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useProductHistory } from '../context/ProductHistoryContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { AuthGuard } from '../components/auth/AuthGuard';

const ProductHistoryPage: React.FC = () => {
  const { viewedProducts, clearHistory, loading } = useProductHistory();
  const navigate = useNavigate();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Recently Viewed Products</h1>
          {viewedProducts.length > 0 && (
            <Button variant="outline" onClick={clearHistory}>
              Clear History
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewedProducts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-600 mb-4">You haven't viewed any products yet</h2>
            <Button onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {viewedProducts.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-1 truncate">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                  <p className="font-bold">${product.price.toFixed(2)}</p>
                </CardContent>
                <CardFooter className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                  Viewed on {formatDate(product.viewedAt)}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProductHistoryPage;