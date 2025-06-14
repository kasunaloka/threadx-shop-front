
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Package, Eye, Loader2 } from 'lucide-react';
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
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', user?.customerId || user?.email],
    queryFn: async () => {
      try {
        console.log('Fetching orders for user:', user?.email, 'customer ID:', user?.customerId);
        
        const queryParams: any = {
          per_page: 20,
          orderby: 'date',
          order: 'desc'
        };
        
        // If we have a customer ID, use it to filter orders
        if (user?.customerId) {
          queryParams.customer = user.customerId;
        }
        
        const fetchedOrders = await wooCommerceApi.getOrders(queryParams);
        console.log('Orders fetched:', fetchedOrders);
        return fetchedOrders;
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!user,
  });

  // Redirect to login if not authenticated
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">View and track your previous orders</p>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
              <p className="text-gray-600 mb-6">
                We couldn't load your order history. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your order history here.
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.line_items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">${parseFloat(item.total).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
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
