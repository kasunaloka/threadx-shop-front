
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      {user?.displayName || 'Not set'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      {user?.username || 'Not set'}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-gray-500" />
                      {user?.email || 'Not set'}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" className="mr-3">
                    Edit Profile
                  </Button>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link 
                  to="/orders" 
                  className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Package className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">View Orders</div>
                    <div className="text-sm text-gray-500">Check your order history</div>
                  </div>
                </Link>
                
                <Link 
                  to="/cart" 
                  className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Package className="mr-3 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Shopping Cart</div>
                    <div className="text-sm text-gray-500">Review items in cart</div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">Recently</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Status</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
