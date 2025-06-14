
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuthContext } from '../context/SupabaseAuthContext';
import { logger } from '../utils/logger';

interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  wc_customer_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useProfileSync = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuthContext();

  // Fetch profile data
  const fetchProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, this is normal for new users
          logger.log('No profile found for user:', user.id);
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      logger.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      logger.log('Profile updated successfully:', data);
      return true;
    } catch (err: any) {
      logger.error('Error updating profile:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sync WordPress customer data to profile
  const syncWordPressData = async (wpData: {
    email: string;
    username: string;
    displayName: string;
    customerId?: number;
  }) => {
    return await updateProfile({
      email: wpData.email,
      username: wpData.username,
      display_name: wpData.displayName,
      wc_customer_id: wpData.customerId || null
    });
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [user]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    syncWordPressData
  };
};
