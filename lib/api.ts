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
          id, full_name, profile_photo_url, city, area,
          chef_profiles ( kitchen_name, rating_average, total_reviews, is_open )
        )
      `)
      .eq('is_active', true)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (city) {
      query = query.eq('chef.city', city);
    }

    const { data, error } = await query;
    // Flatten the nested chef_profiles into a top-level chef_profile for each post
    const normalized = (data || []).map((post: any) => ({
      ...post,
      chef_profile: post.chef?.chef_profiles || null,
    }));
    return { data: normalized, error: error?.message || null };
  },

  /** Fetch a single post detail with reviews */
  async getPostById(postId: string) {
    const { data, error } = await supabase
      .from('daily_posts')
      .select(`
        *,
        chef:users!chef_id (
          id, full_name, profile_photo_url, city,
          chef_profiles ( kitchen_name, rating_average, total_reviews )
        ),
        reviews (
          id, overall_rating, comment, created_at,
          customer:users!customer_id ( full_name, profile_photo_url )
        )
      `)
      .eq('id', postId)
      .single();

    // Flatten nested chef_profiles
    const normalized = data ? {
      ...data,
      chef_profile: (data as any)?.chef?.chef_profiles || null,
    } : null;
    return { data: normalized, error: error?.message || null };
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

    if (qtyError) {
      console.error('[placeOrder] RPC error:', qtyError);
      // If the function doesn't exist in Supabase, give a clearer message
      if (qtyError.message?.includes('function') || qtyError.code === '42883') {
        return { data: null, error: 'Server configuration error: quantity function not found. Please ensure the database migration has been run.' };
      }
      return { data: null, error: qtyError.message };
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) {
      console.error('[placeOrder] Insert error:', error);
    }

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

// ========================
// PREP MENU API (Mode 2)
// ========================

export const prepMenuApi = {
  /** Get chef's prep menu */
  async getByChef(chefId: string) {
    const { data, error } = await supabase
      .from('prep_menu_items')
      .select('*')
      .eq('chef_id', chefId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    return { data: data || [], error: error?.message || null };
  },

  /** Create prep menu item */
  async create(item: any) {
    const { data, error } = await supabase
      .from('prep_menu_items')
      .insert(item)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Update prep menu item */
  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('prep_menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Delete prep menu item */
  async remove(id: string) {
    const { error } = await supabase
      .from('prep_menu_items')
      .update({ is_active: false })
      .eq('id', id);
    return { error: error?.message || null };
  },
};

// ========================
// PREP REQUESTS API (Mode 2)
// ========================

export const prepRequestsApi = {
  /** Submit a prep request */
  async create(request: any) {
    const { data, error } = await supabase
      .from('prep_requests')
      .insert(request)
      .select(`*, menu_item:prep_menu_items(*), customer:users!customer_id(full_name, profile_photo_url)`)
      .single();
    return { data, error: error?.message || null };
  },

  /** Get customer's prep requests */
  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('prep_requests')
      .select(`*, menu_item:prep_menu_items(*), chef:users!chef_id(full_name, profile_photo_url, chef_profiles(kitchen_name))`)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Get chef's incoming requests */
  async getByChef(chefId: string) {
    const { data, error } = await supabase
      .from('prep_requests')
      .select(`*, menu_item:prep_menu_items(*), customer:users!customer_id(full_name, profile_photo_url, phone)`)
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Chef responds to request */
  async respond(id: string, response: { status: string; chef_response_note?: string; counter_price?: number; counter_date?: string }) {
    const { data, error } = await supabase
      .from('prep_requests')
      .update({ ...response, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message || null };
  },
};

// ========================
// SPECIALTIES API (Mode 3)
// ========================

export const specialtiesApi = {
  /** Get chef's specialties */
  async getByChef(chefId: string) {
    const { data, error } = await supabase
      .from('chef_specialties')
      .select('*')
      .eq('chef_id', chefId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Create specialty */
  async create(item: any) {
    const { data, error } = await supabase
      .from('chef_specialties')
      .insert(item)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Update specialty */
  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('chef_specialties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Delete specialty */
  async remove(id: string) {
    const { error } = await supabase
      .from('chef_specialties')
      .update({ is_active: false })
      .eq('id', id);
    return { error: error?.message || null };
  },

  /** Get availability for a specialty's chef */
  async getAvailability(chefId: string, month: string) {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    const { data, error } = await supabase
      .from('chef_availability')
      .select('*')
      .eq('chef_id', chefId)
      .gte('date', startDate)
      .lte('date', endDate);
    return { data: data || [], error: error?.message || null };
  },
};

// ========================
// COMMENTS API
// ========================

export const commentsApi = {
  /** Get comments for a post */
  async getByPost(postId: string, page = 0, limit = 20) {
    const { data, error } = await supabase
      .from('comments')
      .select(`*, user:users!user_id(full_name, profile_photo_url)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    return { data: data || [], error: error?.message || null };
  },

  /** Add comment */
  async create(postId: string, userId: string, text: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, text })
      .select(`*, user:users!user_id(full_name, profile_photo_url)`)
      .single();
    return { data, error: error?.message || null };
  },

  /** Delete comment */
  async remove(id: string) {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    return { error: error?.message || null };
  },

  /** Toggle like */
  async toggleLike(commentId: string, userId: string) {
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('comment_likes').delete().eq('id', existing.id);
      await supabase.rpc('decrement_comment_likes', { p_comment_id: commentId });
      return { liked: false };
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
      await supabase.rpc('increment_comment_likes', { p_comment_id: commentId });
      return { liked: true };
    }
  },
};

// ========================
// FLASH SALES API
// ========================

export const flashSalesApi = {
  /** Get active flash sales */
  async getActive() {
    const { data, error } = await supabase
      .from('flash_sales')
      .select(`*, post:daily_posts(*, chef:users!chef_id(full_name, profile_photo_url, chef_profiles(kitchen_name)))`)
      .eq('is_active', true)
      .gte('ends_at', new Date().toISOString());
    return { data: data || [], error: error?.message || null };
  },

  /** Create flash sale */
  async create(sale: any) {
    const { data, error } = await supabase
      .from('flash_sales')
      .insert(sale)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** End flash sale */
  async end(id: string) {
    const { error } = await supabase
      .from('flash_sales')
      .update({ is_active: false })
      .eq('id', id);
    return { error: error?.message || null };
  },
};

// ========================
// GROUP ORDERS API
// ========================

export const groupOrdersApi = {
  /** Get open group orders */
  async getOpen() {
    const { data, error } = await supabase
      .from('group_orders')
      .select(`*, initiator:users!initiator_id(full_name, profile_photo_url), menu_item:prep_menu_items(title, photos, base_price)`)
      .eq('status', 'open')
      .gte('deadline', new Date().toISOString())
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Create group order */
  async create(order: any) {
    const { data, error } = await supabase
      .from('group_orders')
      .insert(order)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Join group order */
  async join(groupOrderId: string, customerId: string, quantity: number) {
    const { error: joinError } = await supabase
      .from('group_order_participants')
      .insert({ group_order_id: groupOrderId, customer_id: customerId, quantity });
    if (joinError) return { error: joinError.message };

    // Update current_quantity
    const { error: updateError } = await supabase.rpc('increment_group_quantity', {
      p_group_id: groupOrderId,
      p_qty: quantity,
    });
    return { error: updateError?.message || null };
  },

  /** Get by invite code */
  async getByCode(code: string) {
    const { data, error } = await supabase
      .from('group_orders')
      .select(`*, initiator:users!initiator_id(full_name), menu_item:prep_menu_items(title, photos, base_price)`)
      .eq('invite_code', code)
      .single();
    return { data, error: error?.message || null };
  },

  /** Get participants */
  async getParticipants(groupOrderId: string) {
    const { data, error } = await supabase
      .from('group_order_participants')
      .select(`*, customer:users!customer_id(full_name, profile_photo_url)`)
      .eq('group_order_id', groupOrderId);
    return { data: data || [], error: error?.message || null };
  },
};

// ========================
// WAITLIST API
// ========================

export const waitlistApi = {
  /** Join waitlist for a sold-out post */
  async join(postId: string, customerId: string) {
    const { data, error } = await supabase
      .from('waitlist')
      .insert({ post_id: postId, customer_id: customerId })
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Leave waitlist */
  async leave(postId: string, customerId: string) {
    const { error } = await supabase
      .from('waitlist')
      .delete()
      .eq('post_id', postId)
      .eq('customer_id', customerId);
    return { error: error?.message || null };
  },

  /** Check if on waitlist */
  async isOnWaitlist(postId: string, customerId: string) {
    const { data } = await supabase
      .from('waitlist')
      .select('id')
      .eq('post_id', postId)
      .eq('customer_id', customerId)
      .single();
    return !!data;
  },

  /** Get waitlist count */
  async getCount(postId: string) {
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    return count || 0;
  },
};

// ========================
// SUBSCRIPTIONS API
// ========================

export const subscriptionsApi = {
  /** Get customer's subscriptions */
  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`*, chef:users!chef_id(full_name, profile_photo_url, chef_profiles(kitchen_name))`)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Get chef's subscribers */
  async getByChef(chefId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`*, customer:users!customer_id(full_name, profile_photo_url)`)
      .eq('chef_id', chefId)
      .eq('is_active', true);
    return { data: data || [], error: error?.message || null };
  },

  /** Create subscription */
  async create(sub: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(sub)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Toggle pause/resume */
  async toggle(id: string, isActive: boolean) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: isActive })
      .eq('id', id);
    return { error: error?.message || null };
  },

  /** Cancel subscription */
  async cancel(id: string) {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    return { error: error?.message || null };
  },
};

// ========================
// TEASERS API (Coming Soon)
// ========================

export const teasersApi = {
  /** Get active teasers */
  async getActive(chefId?: string) {
    let query = supabase
      .from('teaser_posts')
      .select(`*, chef:users!chef_id(full_name, profile_photo_url, chef_profiles(kitchen_name))`)
      .eq('is_active', true)
      .order('planned_date', { ascending: true });
    if (chefId) query = query.eq('chef_id', chefId);
    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  },

  /** Create teaser */
  async create(teaser: any) {
    const { data, error } = await supabase
      .from('teaser_posts')
      .insert(teaser)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Toggle interest */
  async toggleInterest(teaserId: string, customerId: string) {
    const { data: existing } = await supabase
      .from('teaser_interests')
      .select('id')
      .eq('teaser_id', teaserId)
      .eq('customer_id', customerId)
      .single();

    if (existing) {
      await supabase.from('teaser_interests').delete().eq('id', existing.id);
      await supabase.from('teaser_posts').update({ interested_count: supabase.rpc ? undefined : 0 }).eq('id', teaserId);
      return { interested: false };
    } else {
      await supabase.from('teaser_interests').insert({ teaser_id: teaserId, customer_id: customerId });
      return { interested: true };
    }
  },
};

// ========================
// DISPUTES API
// ========================

export const disputesApi = {
  /** Open a dispute */
  async create(dispute: any) {
    const { data, error } = await supabase
      .from('disputes')
      .insert(dispute)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Get customer's disputes */
  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('disputes')
      .select(`*, order:orders(*)`)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Get chef's disputes */
  async getByChef(chefId: string) {
    const { data, error } = await supabase
      .from('disputes')
      .select(`*, order:orders(*), customer:users!customer_id(full_name, profile_photo_url)`)
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Chef respond */
  async respond(id: string, response: string) {
    const { data, error } = await supabase
      .from('disputes')
      .update({ chef_response: response, status: 'chef_responded' })
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message || null };
  },
};

// ========================
// EARNINGS API
// ========================

export const earningsApi = {
  /** Get chef's earnings */
  async getByChef(chefId: string) {
    const { data, error } = await supabase
      .from('earnings')
      .select(`*, order:orders(*)`)
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Get earnings summary */
  async getSummary(chefId: string) {
    const { data: all } = await supabase
      .from('earnings')
      .select('amount, status, created_at')
      .eq('chef_id', chefId);

    const earnings = all || [];
    const total = earnings.reduce((s, e) => s + e.amount, 0);
    const available = earnings.filter(e => e.status === 'available').reduce((s, e) => s + e.amount, 0);
    const pending = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

    // Weekly breakdown
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = earnings
      .filter(e => new Date(e.created_at) >= weekAgo)
      .reduce((s, e) => s + e.amount, 0);

    return { total, available, pending, thisWeek };
  },

  /** Request withdrawal */
  async requestWithdrawal(chefId: string, amount: number, bankInfo: any) {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert({ chef_id: chefId, amount, bank_info: bankInfo })
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Get withdrawals */
  async getWithdrawals(chefId: string) {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('chef_id', chefId)
      .order('requested_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },
};

// ========================
// ADDRESSES API
// ========================

export const addressesApi = {
  /** Get user's addresses */
  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  /** Add address */
  async create(address: any) {
    const { data, error } = await supabase
      .from('addresses')
      .insert(address)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Update address */
  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  /** Delete address */
  async remove(id: string) {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    return { error: error?.message || null };
  },

  /** Set default */
  async setDefault(userId: string, addressId: string) {
    // Unset all defaults first
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
    // Set the selected one
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId);
    return { error: error?.message || null };
  },
};
