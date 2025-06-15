
import React from 'react';
import { Badge } from './ui/badge';

interface OrderStatusBadgeProps {
  status: string;
}

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

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  return (
    <Badge className={getStatusColor(status)}>
      {getStatusText(status)}
    </Badge>
  );
};

export default OrderStatusBadge;
