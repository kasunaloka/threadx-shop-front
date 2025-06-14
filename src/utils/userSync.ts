
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

    // Generate a temporary password for the Supabase user
    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the user in Supabase
    const { data, error } = await supabase.auth.admin.createUser({
      email: wpUser.email,
      password: tempPassword,
      user_metadata: {
        username: wpUser.username,
        display_name: wpUser.displayName,
        wc_customer_id: wpUser.customerId,
        created_from_wordpress: true
      },
      email_confirm: true // Auto-confirm since they're already verified in WordPress
    });

    if (error) {
      logger.error('Error creating Supabase user:', error);
      return null;
    }

    if (data.user) {
      logger.log('Supabase user created successfully:', data.user.id);
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
    // Update the user's metadata to include WordPress information
    const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
      user_metadata: {
        username: wpUser.username,
        display_name: wpUser.displayName,
        wc_customer_id: wpUser.customerId,
        linked_to_wordpress: true
      }
    });

    if (error) {
      logger.error('Error linking WordPress to Supabase user:', error);
      return false;
    }

    // Sync the profile data
    return await syncWordPressUserToSupabase(wpUser, supabaseUserId);
  } catch (error) {
    logger.error('Error linking WordPress to Supabase user:', error);
    return false;
  }
};
