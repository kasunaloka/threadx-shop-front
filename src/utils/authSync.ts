
import { supabase } from '../lib/supabase';
import { wooCommerceApi } from './woocommerceApi';
import { logger } from './logger';

interface UserData {
  id?: number;
  email: string;
  username: string;
  displayName: string;
  customerId?: number;
  supabaseId?: string;
  firstName?: string;
  lastName?: string;
}

export class AuthSyncService {
  /**
   * Sync user data from WordPress to Supabase
   */
  static async syncWordPressToSupabase(userData: UserData): Promise<void> {
    try {
      logger.log('AuthSync: Syncing WordPress user to Supabase:', userData);

      // Check if user profile exists in Supabase
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        throw fetchError;
      }

      const profileData = {
        email: userData.email,
        username: userData.username,
        display_name: userData.displayName,
        wc_customer_id: userData.customerId,
        updated_at: new Date().toISOString(),
      };

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('email', userData.email);

        if (updateError) throw updateError;
        logger.log('AuthSync: Updated existing Supabase profile');
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) throw insertError;
        logger.log('AuthSync: Created new Supabase profile');
      }
    } catch (error) {
      logger.error('AuthSync: Failed to sync WordPress to Supabase:', error);
      throw error;
    }
  }

  /**
   * Sync user data from Supabase to WordPress (if needed)
   */
  static async syncSupabaseToWordPress(userData: UserData): Promise<void> {
    try {
      logger.log('AuthSync: Syncing Supabase user data:', userData);

      // For Supabase users, we mainly ensure their profile exists in Supabase
      // WordPress sync could be implemented here if needed for your use case
      
      if (userData.supabaseId) {
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.supabaseId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!existingProfile) {
          // Create profile for Supabase user
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userData.supabaseId,
              email: userData.email,
              username: userData.username,
              display_name: userData.displayName,
            });

          if (insertError) throw insertError;
          logger.log('AuthSync: Created Supabase profile for auth user');
        }
      }
    } catch (error) {
      logger.error('AuthSync: Failed to sync Supabase user:', error);
      throw error;
    }
  }

  /**
   * Get unified user profile from both platforms
   */
  static async getUnifiedProfile(email: string): Promise<UserData | null> {
    try {
      logger.log('AuthSync: Getting unified profile for:', email);

      // Get profile from Supabase
      const { data: supabaseProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (supabaseProfile) {
        const unifiedData: UserData = {
          email: supabaseProfile.email,
          username: supabaseProfile.username || email.split('@')[0],
          displayName: supabaseProfile.display_name || supabaseProfile.username || email.split('@')[0],
          supabaseId: supabaseProfile.id,
          customerId: supabaseProfile.wc_customer_id,
        };

        logger.log('AuthSync: Retrieved unified profile:', unifiedData);
        return unifiedData;
      }

      return null;
    } catch (error) {
      logger.error('AuthSync: Failed to get unified profile:', error);
      return null;
    }
  }

  /**
   * Check if user exists in both platforms
   */
  static async checkUserExistence(email: string): Promise<{
    existsInSupabase: boolean;
    existsInWordPress: boolean;
    profile?: UserData;
  }> {
    try {
      // Check Supabase
      const { data: supabaseProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      const existsInSupabase = !!supabaseProfile;

      // For WordPress, we would need to implement a check via API
      // For now, we'll assume WordPress existence based on wc_customer_id
      const existsInWordPress = !!(supabaseProfile?.wc_customer_id);

      return {
        existsInSupabase,
        existsInWordPress,
        profile: supabaseProfile ? {
          email: supabaseProfile.email,
          username: supabaseProfile.username,
          displayName: supabaseProfile.display_name,
          supabaseId: supabaseProfile.id,
          customerId: supabaseProfile.wc_customer_id,
        } : undefined,
      };
    } catch (error) {
      logger.error('AuthSync: Failed to check user existence:', error);
      return {
        existsInSupabase: false,
        existsInWordPress: false,
      };
    }
  }
}
