
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Package, Eye } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import OrderItemsTable from './OrderItemsTable';

interface OrdersListProps {
  orders: any[];
}

const OrdersList: React.FC<OrdersListProps> = ({ orders }) => {
  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500 mb-4">
        Found {orders.length} order{orders.length !== 1 ? 's' : ''}
      </div>
      
      {orders.map((order: any) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
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
                <OrderStatusBadge status={order.status} />
                <p className="text-lg font-semibold mt-2">
                  ${parseFloat(order.total || '0').toFixed(2)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <OrderItemsTable items={order.line_items || []} />
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500 space-y-1">
                <div>Order ID: {order.id}</div>
                {order.payment_method_title && (
                  <div>Payment: {order.payment_method_title}</div>
                )}
                {order.billing?.email && (
                  <div>Email: {order.billing.email}</div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-lg font-semibold">${parseFloat(order.total || '0').toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrdersList;
