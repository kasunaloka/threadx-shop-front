# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your React + WordPress application.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# WordPress Configuration
VITE_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json

# Optional: WooCommerce Configuration (if using WooCommerce)
VITE_WOOCOMMERCE_CONSUMER_KEY=your-woocommerce-consumer-key
VITE_WOOCOMMERCE_CONSUMER_SECRET=your-woocommerce-consumer-secret
```

## Firebase Project Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name and follow setup wizard

2. **Enable Authentication**:
   - In Firebase console, go to "Authentication" → "Sign-in method"
   - Enable "Email/Password"
   - Enable "Google" (optional)
   - Configure other providers as needed

3. **Get Configuration**:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click web icon (</>) to add web app
   - Copy the configuration object
   - Update your `.env.local` file with the values

4. **Get Service Account Key** (for WordPress):
   - In Project Settings, go to "Service accounts" tab
   - Click "Generate new private key"
   - Download the JSON file
   - Use the values in your WordPress plugin configuration

## WordPress Plugin Setup

1. **Install Composer Dependencies**:
   ```bash
   composer require kreait/firebase-php
   ```

2. **Upload Plugin**:
   - Upload the `firebase-auth` plugin to `wp-content/plugins/`
   - Activate the plugin in WordPress admin

3. **Configure Plugin**:
   - Go to Settings → Firebase Auth
   - Enter your Firebase project ID
   - Paste your private key (from service account JSON)
   - Enter your client email (from service account JSON)

## Testing the Integration

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test Authentication**:
   - Navigate to a protected route (e.g., `/checkout`)
   - You should be redirected to the login page
   - Sign up or sign in with Firebase
   - You should be redirected back to the protected route

3. **Test WordPress Integration**:
   - After signing in, the user should be automatically linked to WordPress
   - Check the user profile to see the WordPress user information

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure your WordPress site has proper CORS headers
   - Check that your React app domain is allowed

2. **Firebase Configuration Errors**:
   - Verify all environment variables are set correctly
   - Check that the Firebase project ID matches

3. **WordPress Plugin Errors**:
   - Ensure Composer dependencies are installed
   - Check that the service account credentials are correct
   - Verify the plugin is activated

### Debug Steps

1. **Check Browser Console**:
   - Look for Firebase initialization errors
   - Check for authentication state changes

2. **Check WordPress Debug Log**:
   - Enable `WP_DEBUG` in `wp-config.php`
   - Check for plugin errors in the debug log

3. **Verify API Endpoints**:
   - Test the Firebase token verification endpoint
   - Check that protected routes are working

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env.local` to version control
   - Use different Firebase projects for development and production

2. **Service Account**:
   - Keep your Firebase service account key secure
   - Rotate keys regularly
   - Use environment variables in production

3. **CORS Configuration**:
   - Only allow necessary domains
   - Use HTTPS in production

## Next Steps

1. **Customize Authentication UI**:
   - Modify the Login and SignUp components
   - Add additional authentication providers
   - Implement password reset functionality

2. **Extend WordPress Integration**:
   - Add more protected API endpoints
   - Implement user role management
   - Add WooCommerce integration

3. **Production Deployment**:
   - Set up production Firebase project
   - Configure production WordPress site
   - Set up proper SSL certificates 