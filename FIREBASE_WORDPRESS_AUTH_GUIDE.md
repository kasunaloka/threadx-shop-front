# Firebase Authentication Integration Guide: React + WordPress

This comprehensive guide will walk you through integrating Firebase Authentication with a React.js frontend and WordPress backend, allowing users to authenticate via Firebase and have their authenticated state recognized by WordPress.

## Table of Contents

1. [Firebase Project Configuration](#firebase-project-configuration)
2. [React.js Frontend Integration](#reactjs-frontend-integration)
3. [WordPress Backend Integration](#wordpress-backend-integration)
4. [Overall Workflow](#overall-workflow)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Firebase Project Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "my-react-wordpress-app")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

### Step 2: Enable Authentication

1. In your Firebase project console, navigate to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click "Enable" and check "Email link (passwordless sign-in)" if desired
   - **Google**: Click "Enable" and configure OAuth consent screen
   - **Other providers** as needed (Facebook, Twitter, etc.)

### Step 3: Get Firebase Configuration

1. In Firebase console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname
6. Copy the Firebase configuration object

---

## React.js Frontend Integration

### Step 1: Install Firebase SDK

Firebase is already installed in your project. If you need to install it in a new project:

```bash
npm install firebase
# or
yarn add firebase
```

### Step 2: Create Firebase Configuration

Create a new file `src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
```

### Step 3: Create Authentication Context

Create `src/context/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  async function getIdToken() {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

### Step 4: Create Authentication Components

#### Login Component (`src/components/auth/Login.tsx`):

```typescript
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      setError('Failed to sign in. Please check your credentials.');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setError('Failed to sign in with Google.');
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6">
          <Separator className="my-4" />
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Sign in with Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Sign Up Component (`src/components/auth/SignUp.tsx`):

```typescript
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      await signUp(email, password);
    } catch (error) {
      setError('Failed to create an account.');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setError('Failed to sign up with Google.');
      console.error('Google sign up error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your details to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        
        <div className="mt-6">
          <Separator className="my-4" />
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Sign up with Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Update AuthGuard Component

Update `src/components/auth/AuthGuard.tsx`:

```typescript
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Login } from './Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return <>{children}</>;
}
```

### Step 6: Update App.tsx to Include AuthProvider

Update your `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { Toaster } from './components/ui/toaster';
// Import your other components
import Index from './pages/Index';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route 
              path="/checkout" 
              element={
                <AuthGuard>
                  <Checkout />
                </AuthGuard>
              } 
            />
            <Route 
              path="/order-success" 
              element={
                <AuthGuard>
                  <OrderSuccess />
                </AuthGuard>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

## WordPress Backend Integration

### Step 1: Install Firebase Admin SDK

In your WordPress project directory, install the Firebase Admin SDK:

```bash
composer require kreait/firebase-php
```

### Step 2: Create WordPress Plugin for Firebase Authentication

Create a new file `wp-content/plugins/firebase-auth/firebase-auth.php`:

```php
<?php
/**
 * Plugin Name: Firebase Authentication for WordPress
 * Description: Integrate Firebase Authentication with WordPress REST API
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class FirebaseAuth {
    
    private $firebase_project_id;
    private $firebase_private_key;
    private $firebase_client_email;
    
    public function __construct() {
        $this->firebase_project_id = get_option('firebase_project_id');
        $this->firebase_private_key = get_option('firebase_private_key');
        $this->firebase_client_email = get_option('firebase_client_email');
        
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function register_routes() {
        register_rest_route('firebase-auth/v1', '/verify-token', array(
            'methods' => 'POST',
            'callback' => array($this, 'verify_firebase_token'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('firebase-auth/v1', '/create-user', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_wordpress_user'),
            'permission_callback' => array($this, 'verify_firebase_token_middleware')
        ));
    }
    
    public function verify_firebase_token($request) {
        $token = $request->get_param('token');
        
        if (!$token) {
            return new WP_Error('no_token', 'No token provided', array('status' => 400));
        }
        
        try {
            $decoded_token = $this->verify_token($token);
            return array(
                'valid' => true,
                'uid' => $decoded_token['user_id'],
                'email' => $decoded_token['email'] ?? null,
                'name' => $decoded_token['name'] ?? null
            );
        } catch (Exception $e) {
            return new WP_Error('invalid_token', $e->getMessage(), array('status' => 401));
        }
    }
    
    public function create_wordpress_user($request) {
        $firebase_uid = $request->get_param('firebase_uid');
        $email = $request->get_param('email');
        $name = $request->get_param('name');
        
        // Check if user already exists
        $existing_user = get_user_by('email', $email);
        if ($existing_user) {
            // Update user meta with Firebase UID
            update_user_meta($existing_user->ID, 'firebase_uid', $firebase_uid);
            return array(
                'success' => true,
                'user_id' => $existing_user->ID,
                'message' => 'User updated with Firebase UID'
            );
        }
        
        // Create new WordPress user
        $username = sanitize_user($email);
        $user_id = wp_create_user($username, wp_generate_password(), $email);
        
        if (is_wp_error($user_id)) {
            return new WP_Error('user_creation_failed', $user_id->get_error_message());
        }
        
        // Set user display name
        wp_update_user(array(
            'ID' => $user_id,
            'display_name' => $name,
            'first_name' => $name
        ));
        
        // Store Firebase UID in user meta
        update_user_meta($user_id, 'firebase_uid', $firebase_uid);
        
        return array(
            'success' => true,
            'user_id' => $user_id,
            'message' => 'User created successfully'
        );
    }
    
    public function verify_firebase_token_middleware($request) {
        $auth_header = $request->get_header('Authorization');
        
        if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return false;
        }
        
        $token = $matches[1];
        
        try {
            $decoded_token = $this->verify_token($token);
            $request->set_param('firebase_user', $decoded_token);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function verify_token($token) {
        require_once plugin_dir_path(__FILE__) . 'vendor/autoload.php';
        
        $factory = (new Factory)
            ->withServiceAccount([
                'type' => 'service_account',
                'project_id' => $this->firebase_project_id,
                'private_key_id' => 'your-private-key-id',
                'private_key' => $this->firebase_private_key,
                'client_email' => $this->firebase_client_email,
                'client_id' => 'your-client-id',
                'auth_uri' => 'https://accounts.google.com/o/oauth2/auth',
                'token_uri' => 'https://oauth2.googleapis.com/token',
                'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
                'client_x509_cert_url' => "https://www.googleapis.com/robot/v1/metadata/x509/{$this->firebase_client_email}"
            ]);
        
        $auth = $factory->createAuth();
        
        try {
            $verified_id_token = $auth->verifyIdToken($token);
            return $verified_id_token->claims();
        } catch (Exception $e) {
            throw new Exception('Invalid Firebase token: ' . $e->getMessage());
        }
    }
    
    public function add_admin_menu() {
        add_options_page(
            'Firebase Auth Settings',
            'Firebase Auth',
            'manage_options',
            'firebase-auth',
            array($this, 'admin_page')
        );
    }
    
    public function register_settings() {
        register_setting('firebase-auth', 'firebase_project_id');
        register_setting('firebase-auth', 'firebase_private_key');
        register_setting('firebase-auth', 'firebase_client_email');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Firebase Authentication Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('firebase-auth'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">Project ID</th>
                        <td>
                            <input type="text" name="firebase_project_id" 
                                   value="<?php echo esc_attr(get_option('firebase_project_id')); ?>" 
                                   class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Private Key</th>
                        <td>
                            <textarea name="firebase_private_key" rows="10" cols="50" 
                                      class="large-text"><?php echo esc_textarea(get_option('firebase_private_key')); ?></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Client Email</th>
                        <td>
                            <input type="email" name="firebase_client_email" 
                                   value="<?php echo esc_attr(get_option('firebase_client_email')); ?>" 
                                   class="regular-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}

// Initialize the plugin
new FirebaseAuth();
```

### Step 3: Create Protected REST API Endpoints

Add this to your WordPress theme's `functions.php` or create a separate plugin:

```php
<?php
// Add Firebase authentication to existing REST API endpoints
add_filter('rest_authentication_errors', function($result) {
    // If a previous authentication check was applied,
    // pass that result along without modification
    if (true === $result || is_wp_error($result)) {
        return $result;
    }
    
    // Check for Firebase token in Authorization header
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
        $token = $matches[1];
        
        // Verify the Firebase token
        $firebase_auth = new FirebaseAuth();
        try {
            $decoded_token = $firebase_auth->verify_token($token);
            
            // Set the current user based on Firebase UID
            $user = get_user_by('meta_value', $decoded_token['user_id']);
            if ($user) {
                wp_set_current_user($user->ID);
                return true;
            }
        } catch (Exception $e) {
            return new WP_Error(
                'rest_forbidden',
                'Invalid Firebase token',
                array('status' => 401)
            );
        }
    }
    
    return $result;
});

// Example protected endpoint
add_action('rest_api_init', function() {
    register_rest_route('my-api/v1', '/protected-data', array(
        'methods' => 'GET',
        'callback' => function($request) {
            // This endpoint is now protected by Firebase authentication
            $current_user = wp_get_current_user();
            
            if (!$current_user->exists()) {
                return new WP_Error('rest_forbidden', 'Authentication required', array('status' => 401));
            }
            
            return array(
                'message' => 'This is protected data',
                'user_id' => $current_user->ID,
                'user_email' => $current_user->user_email
            );
        },
        'permission_callback' => '__return_true' // We handle auth in the filter above
    ));
});
```

---

## Overall Workflow

### Authentication Flow

1. **User Registration/Login**:
   - User enters credentials in React app
   - Firebase authenticates the user
   - Firebase returns a JWT token
   - React app stores the token securely

2. **API Request Flow**:
   - React app includes Firebase token in Authorization header
   - WordPress receives the request
   - WordPress plugin verifies the Firebase token
   - If valid, WordPress sets the current user
   - Protected endpoint processes the request

3. **User Creation/Linking**:
   - On first login, React app calls WordPress to create/link user
   - WordPress creates a new user or links to existing user
   - Firebase UID is stored in WordPress user meta

### Code Example: Making Authenticated Requests

Update your React API utilities (`src/utils/woocommerceApi.ts`):

```typescript
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const WORDPRESS_API_URL = 'https://your-wordpress-site.com/wp-json';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: WORDPRESS_API_URL,
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const auth = useAuth();
  const token = await auth.getIdToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Example protected API call
export const fetchProtectedData = async () => {
  try {
    const response = await api.get('/my-api/v1/protected-data');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Example: Create WordPress user on first Firebase login
export const createWordPressUser = async (userData: {
  firebase_uid: string;
  email: string;
  name: string;
}) => {
  try {
    const response = await api.post('/firebase-auth/v1/create-user', userData);
    return response.data;
  } catch (error) {
    console.error('User creation error:', error);
    throw error;
  }
};
```

---

## Security Best Practices

### 1. Environment Variables
Store Firebase configuration in environment variables:

```typescript
// .env.local
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Token Management
- Store tokens securely (not in localStorage for production)
- Implement token refresh logic
- Clear tokens on logout

### 3. WordPress Security
- Use HTTPS for all communications
- Validate and sanitize all inputs
- Implement rate limiting
- Keep WordPress and plugins updated

### 4. CORS Configuration
Configure CORS in WordPress to allow your React app domain:

```php
// Add to functions.php
add_action('init', function() {
    header("Access-Control-Allow-Origin: https://your-react-app.com");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
});
```

---

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure WordPress CORS headers are properly configured
   - Check that your React app domain is allowed

2. **Token Verification Fails**:
   - Verify Firebase service account credentials
   - Check that the token hasn't expired
   - Ensure the project ID matches

3. **User Not Found**:
   - Check if the Firebase UID is properly stored in WordPress user meta
   - Verify the user creation process

4. **Authentication State Not Persisting**:
   - Check Firebase Auth state listener
   - Verify token storage and retrieval

### Debug Tools

1. **Firebase Console**: Monitor authentication events
2. **WordPress Debug Log**: Enable WP_DEBUG for detailed error logging
3. **Browser DevTools**: Check network requests and console errors

---

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Firebase Admin SDK for PHP](https://firebase-php.readthedocs.io/)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

---

This guide provides a complete foundation for integrating Firebase Authentication with your React frontend and WordPress backend. The implementation is secure, scalable, and follows best practices for both platforms.
