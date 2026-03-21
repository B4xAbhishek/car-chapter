import { supabase } from '../lib/supabase';

/**
 * Fetch approved car listings, excluding the current user's own listings.
 * Photos are stored as JSONB in car_listings.photos
 */
export async function fetchCars(excludeUserId = null) {
  if (!supabase) {
    console.warn('Supabase not configured.');
    return [];
  }

  let query = supabase
    .from('car_listings')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Fetch ALL listings for admin (pending + approved + rejected).
 */
export async function fetchAllListingsForAdmin(statusFilter = null) {
  if (!supabase) return [];

  let query = supabase
    .from('car_listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Update listing status (admin only).
 */
export async function updateListingStatus(id, status) {
  const { error } = await supabase
    .from('car_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
