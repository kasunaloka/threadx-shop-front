
import React from 'react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/dataMappers';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal, isLoading } = useCart();

  const handleQuantityUpdate = async (key: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(key);
      return;
    }
    await updateQuantity(key, newQuantity);
  };

  const handleRemoveItem = async (key: string, itemName: string) => {
    await removeFromCart(key);
    toast.success(`${itemName} removed from cart`);
  };

  const handleClearCart = async () => {
    await clearCart();
    toast.success('Cart cleared successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="h-96 bg-gray-300 rounded-lg"></div>
                </div>
                <div className="lg:col-span-1">
                  <div className="h-96 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm p-12">
              <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
              <p className="text-gray-600 text-lg mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Link to="/products">
                <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shipping = 5.00;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-black" />
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
            <Link to="/products">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Cart Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {cartItems.map((item, index) => (
                    <div key={item.key || item.id}>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image */}
                        <div className="w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={item.image || '/placeholder.svg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                              {item.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.size && (
                                <Badge variant="outline" className="text-xs">
                                  Size: {item.size}
                                </Badge>
                              )}
                              {item.color && (
                                <Badge variant="outline" className="text-xs">
                                  Color: {item.color}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 min-w-16">Qty:</span>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => handleQuantityUpdate(item.key || item.id.toString(), item.quantity - 1)}
                                  disabled={isLoading || item.quantity <= 1}
                                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 min-w-12 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityUpdate(item.key || item.id.toString(), item.quantity + 1)}
                                  disabled={isLoading}
                                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Price and Remove */}
                            <div className="flex items-center justify-between sm:justify-end gap-6">
                              <div className="text-right">
                                <div className="text-sm text-gray-600">
                                  {formatPrice(item.price)} each
                                </div>
                                <div className="font-bold text-lg text-gray-900">
                                  {formatPrice(item.price * item.quantity)}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(item.key || item.id.toString(), item.name)}
                                disabled={isLoading}
                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Remove item"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < cartItems.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Clear Cart Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleClearCart}
                  disabled={isLoading}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{formatPrice(shipping)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Link to="/checkout" className="w-full">
                      <Button 
                        className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg font-semibold"
                        disabled={isLoading}
                      >
                        Proceed to Checkout
                      </Button>
                    </Link>
                    
                    <div className="text-center">
                      <Link 
                        to="/products" 
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-blue-50 p-4 rounded-lg mt-6">
                    <h4 className="font-medium text-blue-900 mb-2">Shipping Information</h4>
                    <p className="text-sm text-blue-700">
                      Free shipping on orders over $50. Standard delivery takes 3-5 business days.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
