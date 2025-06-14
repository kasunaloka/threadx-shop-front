
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

interface WordPressUser {
  id?: number;
  email: string;
  username: string;
  displayName: string;
  customerId?: number;
}

export const syncWordPressUserToSupabase = async (
  wpUser: WordPressUser,
  supabaseUserId: string
): Promise<boolean> => {
  try {
    logger.log('Syncing WordPress user to Supabase:', wpUser);

    // Call the edge function to sync user data
    const { data, error } = await supabase.functions.invoke('sync-wordpress-user', {
      body: {
        wpUser,
        supabaseUserId
      }
    });

    if (error) {
      logger.error('Error calling sync function:', error);
      return false;
    }

    logger.log('User sync successful:', data);
    return true;
  } catch (error) {
    logger.error('Error syncing WordPress user to Supabase:', error);
    return false;
  }
};

export const createSupabaseUserFromWordPress = async (
  wpUser: WordPressUser
): Promise<string | null> => {
  try {
    logger.log('Creating Supabase user from WordPress user:', wpUser);

    // Generate a secure temporary password for the Supabase user
    const tempPassword = `wp_sync_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;

    // Create the user in Supabase
    const { data, error } = await supabase.auth.admin.createUser({
      email: wpUser.email,
      password: tempPassword,
      user_metadata: {
        username: wpUser.username,
        display_name: wpUser.displayName,
        wc_customer_id: wpUser.customerId,
        created_from_wordpress: true,
        sync_source: 'wordpress'
      },
      email_confirm: true // Auto-confirm since they're already verified in WordPress
    });

    if (error) {
      logger.error('Error creating Supabase user:', error);
      return null;
    }

    if (data.user) {
      logger.log('Supabase user created successfully:', data.user.id);
      
      // Immediately sync the profile data
      await syncWordPressUserToSupabase(wpUser, data.user.id);
      
      return data.user.id;
    }

    return null;
  } catch (error) {
    logger.error('Error creating Supabase user from WordPress:', error);
    return null;
  }
};

export const linkWordPressToSupabaseUser = async (
  wpUser: WordPressUser,
  supabaseUserId: string
): Promise<boolean> => {
  try {
    logger.log('Linking WordPress user to existing Supabase user:', { wpUser, supabaseUserId });

    // Update the user's metadata to include WordPress information
    const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
      user_metadata: {
        username: wpUser.username,
        display_name: wpUser.displayName,
        wc_customer_id: wpUser.customerId,
        linked_to_wordpress: true,
        wordpress_user_id: wpUser.id,
        sync_source: 'dual'
      }
    });

    if (error) {
      logger.error('Error linking WordPress to Supabase user:', error);
      return false;
    }

    // Sync the profile data
    const syncSuccess = await syncWordPressUserToSupabase(wpUser, supabaseUserId);
    
    if (syncSuccess) {
      logger.log('WordPress user successfully linked to Supabase user');
    }
    
    return syncSuccess;
  } catch (error) {
    logger.error('Error linking WordPress to Supabase user:', error);
    return false;
  }
};

export const getSupabaseUserByEmail = async (email: string): Promise<string | null> => {
  try {
    // This would require admin privileges, so we'll rely on sign-in attempts instead
    logger.log('Checking for existing Supabase user with email:', email);
    return null;
  } catch (error) {
    logger.error('Error checking for existing Supabase user:', error);
    return null;
  }
};

export const validateUserSync = async (
  wpUser: WordPressUser,
  supabaseUserId: string
): Promise<boolean> => {
  try {
    // Verify that the sync is working by checking the profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (error) {
      logger.error('Error validating user sync:', error);
      return false;
    }

    if (profile) {
      const isValid = (
        profile.email === wpUser.email &&
        profile.username === wpUser.username &&
        profile.wc_customer_id === wpUser.customerId
      );
      
      logger.log('User sync validation result:', { isValid, profile, wpUser });
      return isValid;
    }

    return false;
  } catch (error) {
    logger.error('Error validating user sync:', error);
    return false;
  }
};
