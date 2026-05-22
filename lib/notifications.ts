import { Platform } from 'react-native';
import { supabase } from './supabase';

// ========================
// PUSH NOTIFICATION SETUP
// ========================

let Notifications: any = null;
let Device: any = null;

// Lazy load expo-notifications (may not be installed)
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (e) {
  console.log('expo-notifications not available, push notifications disabled');
}

/**
 * Register for push notifications and store token
 */
export async function registerForPushNotifications(userId: string) {
  if (!Notifications || !Device) return null;

  if (Platform.OS === 'web') return null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Store token in user record
    await supabase.from('users').update({
      // push_token: token, // Add this column if needed
    }).eq('id', userId);

    // Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B00',
      });

      Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });

      Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions & Deals',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token;
  } catch (error) {
    console.error('Push notification registration failed:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function sendLocalNotification(title: string, body: string, data?: any) {
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null, // immediate
  });
}

// ========================
// NOTIFICATION TRIGGERS
// ========================

/**
 * All 11 notification events from the brief
 */
export const NotificationTriggers = {
  // 1. New order received (for chef)
  orderReceived: (chefName: string, dishTitle: string) =>
    sendLocalNotification('🍽️ New Order!', `You received a new order for "${dishTitle}"!`),

  // 2. Order status change (for customer)
  orderStatusChanged: (status: string, dishTitle: string) => {
    const messages: Record<string, string> = {
      preparing: `👨‍🍳 Your "${dishTitle}" is being prepared!`,
      ready: `✅ Your "${dishTitle}" is ready!`,
      on_the_way: `🚗 Your order is on the way!`,
      delivered: `🎉 Your "${dishTitle}" has been delivered!`,
      cancelled: `❌ Your order for "${dishTitle}" was cancelled.`,
    };
    sendLocalNotification('Order Update', messages[status] || `Order status: ${status}`);
  },

  // 3. New prep request (for chef)
  prepRequestReceived: (customerName: string, dishTitle: string) =>
    sendLocalNotification('📋 New Prep Request', `${customerName} wants you to prepare "${dishTitle}"`),

  // 4. Prep request response (for customer)
  prepRequestResponse: (status: string, dishTitle: string) => {
    const msgs: Record<string, string> = {
      accepted: `✅ Your prep request for "${dishTitle}" was accepted!`,
      rejected: `❌ Your prep request for "${dishTitle}" was declined.`,
      countered: `💬 The chef sent a counter-offer for "${dishTitle}"!`,
    };
    sendLocalNotification('Prep Request Update', msgs[status] || `Request ${status}`);
  },

  // 5. Flash sale started (for followers)
  flashSaleStarted: (chefName: string, discount: number) =>
    sendLocalNotification('⚡ Flash Sale!', `${chefName} just dropped a ${discount}% flash sale! Don't miss it!`),

  // 6. Group order target reached
  groupOrderReached: (title: string) =>
    sendLocalNotification('👥 Target Reached!', `Group order "${title}" reached its target! The chef is starting preparation.`),

  // 7. Waitlist spot available
  waitlistAvailable: (dishTitle: string) =>
    sendLocalNotification('🔔 Spot Available!', `"${dishTitle}" has a spot! You have 15 minutes to order.`),

  // 8. New message received
  newMessage: (senderName: string) =>
    sendLocalNotification('💬 New Message', `${senderName} sent you a message`),

  // 9. New review (for chef)
  newReview: (customerName: string, rating: number) =>
    sendLocalNotification('⭐ New Review', `${customerName} gave you ${rating} stars!`),

  // 10. Subscription order placed
  subscriptionOrderPlaced: (dishTitle: string) =>
    sendLocalNotification('🔁 Subscription Order', `Your recurring order for "${dishTitle}" has been placed!`),

  // 11. Teaser post published (for followers)
  teaserPublished: (chefName: string, dishTitle: string) =>
    sendLocalNotification('🎬 Coming Soon!', `${chefName} teased "${dishTitle}" — tap to show interest!`),
};

// ========================
// NOTIFICATION LISTENER SETUP
// ========================

export function setupNotificationListeners(onNotificationTap: (data: any) => void) {
  if (!Notifications) return () => {};

  // Handle notification tap
  const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
    const data = response.notification.request.content.data;
    onNotificationTap(data);
  });

  // Configure foreground handling
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  return () => subscription.remove();
}
