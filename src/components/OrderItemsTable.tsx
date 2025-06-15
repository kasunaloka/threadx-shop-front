
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface OrderItem {
  id?: number;
  name: string;
  quantity: number;
  total: string;
  product_id?: number;
  variation_id?: number;
}

interface OrderItemsTableProps {
  items: OrderItem[];
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items found in this order
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: OrderItem, index: number) => (
            <TableRow key={item.id || index}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{item.name}</div>
                  {item.product_id && (
                    <div className="text-xs text-gray-500">
                      Product ID: {item.product_id}
                      {item.variation_id && ` (Variation: ${item.variation_id})`}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                  {item.quantity}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                ${parseFloat(item.total || '0').toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderItemsTable;
