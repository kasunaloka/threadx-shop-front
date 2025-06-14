
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Package, Eye, Loader2, RefreshCw } from 'lucide-react';
import { wooCommerceApi } from '../utils/woocommerceApi';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'shipped':
    case 'on-hold':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
    case 'refunded':
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Orders = () => {
  const { isAuthenticated, user } = useAuth();

  // Fetch orders from WooCommerce API
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.customerId, user?.email],
    queryFn: async () => {
      console.log('🔄 Orders query function called');
      console.log('👤 Current user:', user);
      
      if (!user) {
        console.log('❌ No user available for orders fetch');
        return [];
      }
      
      const fetchedOrders = await wooCommerceApi.getOrders({
        customer: user.customerId,
        per_page: 20,
        orderby: 'date',
        order: 'desc'
      });
      
      console.log('📦 Final orders result:', fetchedOrders);
      return fetchedOrders;
    },
    enabled: isAuthenticated && !!user,
    retry: 1,
    retryDelay: 2000,
  });

  // Show authentication message if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to view your order history.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
              >
                Go to Login
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
            <p className="text-gray-600">
              View and track your orders {user?.email && `for ${user.email}`}
              {user?.customerId && ` (Customer ID: ${user.customerId})`}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="text-center py-16">
              <Loader2 className="mx-auto h-16 w-16 text-gray-400 mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Orders...</h2>
              <p className="text-gray-600">Please wait while we fetch your order history.</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
              <p className="text-gray-600 mb-6">
                Unable to connect to WordPress. Please check your connection and try again.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h2>
              <p className="text-gray-600 mb-6">
                {user?.customerId ? 
                  "No orders found for your account. Start shopping to see your order history here." :
                  "Unable to find your customer account. Please try logging out and back in."
                }
              </p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
              >
                Start Shopping
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-500 mb-4">
              Found {orders.length} order{orders.length !== 1 ? 's' : ''}
            </div>
            
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Order #{order.number || order.id}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {new Date(order.date_created).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <p className="text-lg font-semibold mt-2">
                        ${parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.line_items && order.line_items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.line_items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">${parseFloat(item.total).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No items found in this order</p>
                  )}
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <button className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-semibold">${parseFloat(order.total).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Orders;
