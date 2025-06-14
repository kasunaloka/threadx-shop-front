
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
import { logger } from '../utils/logger';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'shipped':
    case 'on-hold':
      return 'bg-orange-100 text-orange-800';
    case 'cancelled':
    case 'refunded':
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending Payment';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'on-hold':
      return 'On Hold';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    case 'failed':
      return 'Failed';
    case 'shipped':
      return 'Shipped';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const Orders = () => {
  const { isAuthenticated, user } = useAuth();

  // Fetch orders with improved error handling and retry logic
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.customerId, user?.email],
    queryFn: async () => {
      logger.log('🔄 Fetching orders for user:', user);
      
      if (!user) {
        logger.log('❌ No user available for orders fetch');
        return [];
      }
      
      try {
        // Try with customer ID first if available
        let fetchedOrders = [];
        
        if (user.customerId) {
          logger.log('👤 Fetching orders with customer ID:', user.customerId);
          fetchedOrders = await wooCommerceApi.getOrders({
            customer: user.customerId,
            per_page: 20,
            orderby: 'date',
            order: 'desc'
          });
        }
        
        // If no orders found with customer ID, try without customer filter
        if (fetchedOrders.length === 0) {
          logger.log('🔄 No orders found with customer ID, trying general fetch');
          fetchedOrders = await wooCommerceApi.getOrders({
            per_page: 20,
            orderby: 'date',
            order: 'desc'
          });
          
          // Filter by email if we have orders
          if (fetchedOrders.length > 0 && user.email) {
            logger.log('📧 Filtering orders by email:', user.email);
            fetchedOrders = fetchedOrders.filter(order => 
              order.billing?.email === user.email ||
              order.customer_id === user.customerId
            );
          }
        }
        
        logger.log('📦 Final orders result:', fetchedOrders.length, 'orders');
        return fetchedOrders;
      } catch (error) {
        logger.error('❌ Error fetching orders:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!user,
    retry: 2,
    retryDelay: 3000,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
              View and track your orders
              {user?.email && ` for ${user.email}`}
              {user?.customerId && ` (Customer ID: ${user.customerId})`}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Orders</h2>
              <p className="text-gray-600 mb-4">
                There was an error loading your order history. This could be due to:
              </p>
              <ul className="text-sm text-gray-500 mb-6 space-y-1">
                <li>• Connection issues with the server</li>
                <li>• Authentication problems</li>
                <li>• Server maintenance</li>
              </ul>
              <div className="space-x-4">
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Re-login
                </Link>
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
                  "Unable to find your customer account. Try logging out and back in, or contact support."
                }
              </p>
              <div className="space-x-4">
                <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  Start Shopping
                </Link>
                {!user?.customerId && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('wc_user');
                      localStorage.removeItem('wc_jwt_token');
                      window.location.href = '/login';
                    }}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Re-login
                  </button>
                )}
              </div>
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
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                      <p className="text-lg font-semibold mt-2">
                        ${parseFloat(order.total || '0').toFixed(2)}
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
                            <TableCell className="text-right">${parseFloat(item.total || '0').toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No items found in this order</p>
                  )}
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Order ID: {order.id}
                      {order.payment_method_title && (
                        <span className="ml-4">Payment: {order.payment_method_title}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-semibold">${parseFloat(order.total || '0').toFixed(2)}</p>
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
