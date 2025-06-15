
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Package, Eye, Loader2, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { logger } from '../utils/logger';
import OrdersList from '../components/OrdersList';
import OrdersFilters from '../components/OrdersFilters';

const Orders = () => {
  const { isAuthenticated, user } = useAuth();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('date');

  // Fetch orders with improved error handling
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.customerId, user?.email, statusFilter],
    queryFn: async () => {
      logger.log('🔄 Fetching orders for user:', user);
      
      if (!user) {
        logger.log('❌ No user available for orders fetch');
        return [];
      }
      
      try {
        const fetchParams: any = {
          per_page: 50,
          orderby: sortBy === 'date' ? 'date' : 'id',
          order: 'desc'
        };

        if (statusFilter !== 'all') {
          fetchParams.status = statusFilter;
        }

        const fetchedOrders = await wooCommerceApi.getOrders(fetchParams);
        
        logger.log('📦 Orders fetched successfully:', fetchedOrders.length);
        return fetchedOrders;
      } catch (error) {
        logger.error('❌ Error fetching orders:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!user,
    retry: 2,
    retryDelay: 3000,
    staleTime: 5 * 60 * 1000,
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

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime();
    }
    return (b.id || 0) - (a.id || 0);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
              <p className="text-gray-600">
                Track and manage your orders
                {user?.email && ` for ${user.email}`}
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

          <OrdersFilters 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            ordersCount={orders.length}
          />
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
              <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Orders</h2>
              <p className="text-gray-600 mb-4">
                There was an error loading your order history.
              </p>
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
        ) : sortedOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No Orders Found' : `No ${statusFilter} Orders`}
              </h2>
              <p className="text-gray-600 mb-6">
                {statusFilter === 'all' 
                  ? "You haven't placed any orders yet." 
                  : `You don't have any ${statusFilter} orders.`
                }
              </p>
              <div className="space-x-4">
                <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  Start Shopping
                </Link>
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    View All Orders
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <OrdersList orders={sortedOrders} />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Orders;
