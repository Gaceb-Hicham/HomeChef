import { supabase } from './supabase';
import type { Database } from './supabase';

type Post = Database['public']['Tables']['daily_posts']['Row'];
type PostInsert = Database['public']['Tables']['daily_posts']['Insert'];
type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type Review = Database['public']['Tables']['reviews']['Row'];
type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

// ========================
// POSTS API
// ========================

export const postsApi = {
  /** Fetch today's feed with chef info */
  async getFeed(city?: string) {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('daily_posts')
      .select(`
        *,
        chef:users!chef_id (
          id, full_name, profile_photo_url, city, area
        ),
        chef_profile:chef_profiles!daily_posts_chef_id_fkey (
          kitchen_name, rating_average, total_reviews, is_open
        )
      `)
      .eq('is_active', true)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (city) {
      query = query.eq('chef.city', city);
    }

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  },

  /** Fetch a single post detail with reviews */
  async getPostById(postId: string) {
    const { data, error } = await supabase
      .from('daily_posts')
      .select(`
        *,
        chef:users!chef_id (
          id, full_name, profile_photo_url, city
        ),
        chef_profile:chef_profiles!daily_posts_chef_id_fkey (
          kitchen_name, rating_average, total_reviews
        ),
        reviews (
          id, overall_rating, comment, created_at,
          customer:users!customer_id ( full_name, profile_photo_url )
        )
      `)
      .eq('id', postId)
      .single();

    return { data, error: error?.message || null };
  },

  /** Create a new daily post (chef) */
  async createPost(post: PostInsert) {
    const { data, error } = await supabase
      .from('daily_posts')
      .insert(post)
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /** Update a post (chef) */
  async updatePost(postId: string, updates: Partial<PostInsert>) {
    const { error } = await supabase
      .from('daily_posts')
      .update(updates)
      .eq('id', postId);

    return { error: error?.message || null };
  },

  /** Get chef's post archive */
  async getChefArchive(chefId: string, limit = 20) {
    const { data, error } = await supabase
      .from('daily_posts')
      .select('*')
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error: error?.message || null };
  },

  /** Search posts by title */
  async searchPosts(query: string) {
    const { data, error } = await supabase
      .from('daily_posts')
      .select(`
        *,
        chef:users!chef_id ( id, full_name, profile_photo_url )
      `)
      .eq('is_active', true)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    return { data: data || [], error: error?.message || null };
  },

  /** Delete (deactivate) a post */
  async deletePost(postId: string) {
    const { error } = await supabase
      .from('daily_posts')
      .update({ is_active: false })
      .eq('id', postId);

    return { error: error?.message || null };
  },
};

// ========================
// ORDERS API
// ========================

export const ordersApi = {
  /** Place a new order */
  async placeOrder(order: OrderInsert) {
    // Start by decrementing the post quantity
    const { error: qtyError } = await supabase.rpc('decrement_remaining_quantity', {
      p_post_id: order.post_id,
      p_qty: order.quantity,
    });

    if (qtyError) return { data: null, error: qtyError.message };

    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /** Get customer's orders */
  async getCustomerOrders(customerId: string, status?: string) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        post:daily_posts!post_id ( title, photos, price ),
        chef:users!chef_id ( full_name, profile_photo_url )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('order_status', status);
    }

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  },

  /** Get chef's incoming orders */
  async getChefOrders(chefId: string, status?: string) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        post:daily_posts!post_id ( title, photos ),
        customer:users!customer_id ( full_name, profile_photo_url, phone )
      `)
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('order_status', status);
    }

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  },

  /** Update order status (chef) */
  async updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId);

    return { error: error?.message || null };
  },

  /** Get order detail */
  async getOrderById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        post:daily_posts!post_id ( title, photos, price ),
        chef:users!chef_id ( full_name, profile_photo_url, phone ),
        customer:users!customer_id ( full_name, phone ),
        review:reviews!order_id ( id, overall_rating, comment )
      `)
      .eq('id', orderId)
      .single();

    return { data, error: error?.message || null };
  },

  /** Get chef earnings stats */
  async getChefEarnings(chefId: string, period: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('total_price, created_at')
      .eq('chef_id', chefId)
      .eq('order_status', 'delivered')
      .gte('created_at', startDate.toISOString());

    const total = (data || []).reduce((sum, o) => sum + o.total_price, 0);
    const count = data?.length || 0;

    return { total, count, orders: data || [], error: error?.message || null };
  },
};

// ========================
// REVIEWS API
// ========================

export const reviewsApi = {
  /** Submit a review */
  async createReview(review: ReviewInsert) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single();

    // Also increment chef's total_orders_fulfilled
    if (!error) {
      await supabase.rpc('update_chef_rating'); // Trigger handles this
    }

    return { data, error: error?.message || null };
  },

  /** Get reviews for a chef */
  async getChefReviews(chefId: string, limit = 20) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customer:users!customer_id ( full_name, profile_photo_url ),
        post:daily_posts!post_id ( title )
      `)
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error: error?.message || null };
  },

  /** Chef replies to a review */
  async replyToReview(reviewId: string, reply: string) {
    const { error } = await supabase
      .from('reviews')
      .update({ chef_reply: reply })
      .eq('id', reviewId);

    return { error: error?.message || null };
  },
};

// ========================
// CHEF PROFILES API
// ========================

export const chefApi = {
  /** Get chef profile with user info */
  async getChefProfile(userId: string) {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select(`
        *,
        user:users!user_id ( full_name, profile_photo_url, email, phone, city )
      `)
      .eq('user_id', userId)
      .single();

    return { data, error: error?.message || null };
  },

  /** Create chef profile (onboarding) */
  async createChefProfile(profile: {
    user_id: string;
    kitchen_name: string;
    bio?: string;
    specialty_tags?: string[];
    delivery_radius_km?: number;
  }) {
    const { data, error } = await supabase
      .from('chef_profiles')
      .insert(profile)
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /** Update chef profile */
  async updateChefProfile(userId: string, updates: Record<string, any>) {
    const { error } = await supabase
      .from('chef_profiles')
      .update(updates)
      .eq('user_id', userId);

    return { error: error?.message || null };
  },

  /** Toggle kitchen open/closed */
  async toggleKitchen(userId: string, isOpen: boolean) {
    return this.updateChefProfile(userId, { is_open: isOpen });
  },

  /** Get nearby chefs */
  async getNearbyChefs(city?: string, limit = 10) {
    let query = supabase
      .from('chef_profiles')
      .select(`
        *,
        user:users!user_id ( id, full_name, profile_photo_url, city, area )
      `)
      .eq('is_open', true)
      .order('rating_average', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  },
};

// ========================
// NOTIFICATIONS API
// ========================

export const notificationsApi = {
  /** Get user notifications */
  async getNotifications(userId: string, limit = 30) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error: error?.message || null };
  },

  /** Mark notification as read */
  async markAsRead(notifId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);

    return { error: error?.message || null };
  },

  /** Mark all as read */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error: error?.message || null };
  },

  /** Get unread count */
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { count: count || 0, error: error?.message || null };
  },
};

// ========================
// SAVED ITEMS API
// ========================

export const savedApi = {
  /** Toggle save/unsave */
  async toggleSaved(userId: string, type: 'chef' | 'dish', referenceId: string) {
    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('reference_id', referenceId)
      .single();

    if (existing) {
      const { error } = await supabase.from('saved_items').delete().eq('id', existing.id);
      return { saved: false, error: error?.message || null };
    } else {
      const { error } = await supabase.from('saved_items').insert({
        user_id: userId,
        type,
        reference_id: referenceId,
      });
      return { saved: true, error: error?.message || null };
    }
  },

  /** Get saved items */
  async getSavedItems(userId: string, type?: 'chef' | 'dish') {
    let query = supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  },

  /** Check if item is saved */
  async isSaved(userId: string, type: 'chef' | 'dish', referenceId: string) {
    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('reference_id', referenceId)
      .single();

    return !!data;
  },
};

// ========================
// FOLLOWERS API
// ========================

export const followersApi = {
  /** Toggle follow/unfollow */
  async toggleFollow(followerId: string, chefId: string) {
    const { data: existing } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('chef_id', chefId)
      .single();

    if (existing) {
      const { error } = await supabase.from('followers').delete().eq('id', existing.id);
      return { following: false, error: error?.message || null };
    } else {
      const { error } = await supabase.from('followers').insert({
        follower_id: followerId,
        chef_id: chefId,
      });
      return { following: true, error: error?.message || null };
    }
  },

  /** Get follower count */
  async getFollowerCount(chefId: string) {
    const { count } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('chef_id', chefId);

    return count || 0;
  },

  /** Check if following */
  async isFollowing(followerId: string, chefId: string) {
    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('chef_id', chefId)
      .single();

    return !!data;
  },
};
