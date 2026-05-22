export default {
  // Common
  app_name: 'HomeChef',
  loading: 'Loading...',
  error: 'Error',
  retry: 'Retry',
  cancel: 'Cancel',
  save: 'Save',
  done: 'Done',
  confirm: 'Confirm',
  delete: 'Delete',
  edit: 'Edit',
  search: 'Search',
  see_all: 'See all',
  back: 'Back',
  close: 'Close',
  or: 'or',
  and: 'and',

  // Auth
  auth: {
    login: 'Log In',
    signup: 'Sign Up',
    logout: 'Log Out',
    email: 'Email',
    password: 'Password',
    phone: 'Phone Number',
    forgot_password: 'Forgot Password?',
    otp_title: 'Enter Verification Code',
    otp_subtitle: 'We sent a 6-digit code to your phone',
    resend: 'Resend Code',
    welcome_back: 'Welcome Back',
    create_account: 'Create Account',
    role_customer: 'I want to order food',
    role_chef: 'I want to cook & sell',
  },

  // Home
  home: {
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    todays_specials: "Today's Specials",
    categories: {
      all: 'All',
      meals: '🍲 Meals',
      desserts: '🍰 Desserts',
      salads: '🥗 Salads',
      bakery: '🍞 Bakery',
      drinks: '🥤 Drinks',
    },
    left: 'left',
  },

  // Search
  search_screen: {
    placeholder: 'Search dishes, chefs...',
    recent: 'Recent',
    trending: 'Trending',
    nearby_chefs: 'Nearby Chefs',
    clear: 'Clear',
    no_results: 'No results found',
  },

  // Cart
  cart: {
    title: 'My Cart',
    empty: 'Your cart is empty',
    empty_subtitle: 'Explore delicious homemade dishes nearby',
    subtotal: 'Subtotal',
    delivery_fee: 'Delivery Fee',
    total: 'Total',
    checkout: 'Checkout',
    remove: 'Remove',
    browse: 'Browse Dishes',
  },

  // Orders
  orders: {
    title: 'My Orders',
    active: 'Active',
    past: 'Past',
    no_active: 'No active orders',
    no_past: 'No past orders yet',
    track: 'Track Order',
    leave_review: 'Leave Review',
    status: {
      received: 'Received',
      preparing: 'Preparing',
      ready: 'Ready',
      out_for_delivery: 'On the Way',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    },
  },

  // Tracking
  tracking: {
    title: 'Track Order',
    eta: 'Estimated Arrival',
    contact_chef: 'Contact Chef',
    live: 'LIVE',
    now: 'NOW',
    steps: {
      received: 'Your order has been confirmed',
      preparing: 'Chef is preparing your food',
      ready: 'Your order is ready',
      out_for_delivery: 'Your food is being delivered',
      delivered: 'Enjoy your meal!',
    },
  },

  // Checkout
  checkout: {
    title: 'Checkout',
    delivery_method: 'Delivery Method',
    delivery: 'Delivery',
    pickup: 'Pickup',
    address: 'Delivery Address',
    time_slot: 'Time Slot',
    payment: 'Payment Method',
    card: 'Card',
    cash: 'Cash',
    note: 'Note for Chef (optional)',
    note_placeholder: 'Any special requests...',
    summary: 'Order Summary',
    place_order: 'Place Order',
    order_placed: 'Order Placed! 🎉',
    order_confirmed: 'Your order has been confirmed.',
    view_orders: 'View Orders',
  },

  // Chef Dashboard
  chef: {
    welcome_back: 'Welcome back',
    kitchen_open: 'Your kitchen is open',
    kitchen_closed: 'Your kitchen is closed',
    open: 'Open',
    close: 'Close',
    todays_orders: "Today's Orders",
    todays_revenue: "Today's Revenue",
    pending: 'Pending',
    avg_rating: 'Avg Rating',
    post_special: "Post Today's Special",
    recent_orders: 'Recent Orders',
    view_all: 'View all',
    mark_as: 'Mark as',
  },

  // Create Post
  create_post: {
    title: 'Post Special',
    dish_name: 'Dish Name',
    description: 'Description',
    price: 'Price (DA)',
    quantity: 'Quantity',
    deadline: 'Order Deadline',
    delivery_available: 'Delivery Available',
    pickup_available: 'Pickup Available',
    allow_preorder: 'Allow Pre-orders',
    publish: 'Publish Special',
    published: 'Published! 🎉',
    published_message: 'Your daily special is now live.',
    add_photos: 'Add Photos (up to 5)',
  },

  // Earnings
  earnings: {
    title: 'Earnings',
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    total_revenue: 'Total Revenue',
    orders_completed: 'Orders Completed',
    avg_per_order: 'Avg per Order',
    payout_status: 'Payout Status',
    request_payout: 'Request Payout',
    revenue_breakdown: 'Revenue Breakdown',
  },

  // Profile
  profile: {
    title: 'Profile',
    edit: 'Edit Profile',
    settings: 'Settings',
    language: 'Language',
    notifications_setting: 'Notifications',
    help: 'Help & Support',
    about: 'About HomeChef',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    delete_account: 'Delete Account',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    read_all: 'Read all',
    empty: 'No notifications yet',
  },

  // Saved
  saved: {
    title: 'Saved',
    dishes: 'Dishes',
    chefs: 'Chefs',
  },

  // Review
  review: {
    title: 'Write Review',
    overall: 'Overall Rating',
    taste: 'Taste',
    packaging: 'Packaging',
    accuracy: 'Accuracy',
    comment: 'Your review',
    submit: 'Submit Review',
    thanks: 'Thank you for your review!',
  },

  // Prep Requests (Mode 2)
  prep: {
    title: 'Preparation Request',
    menu: 'Prep Menu',
    request: 'Request',
    requests: 'Prep Requests',
    date: 'When do you want it?',
    quantity: 'Quantity',
    your_offer: 'Your Offer',
    instructions: 'Special Instructions',
    summary: 'Request Summary',
    submit: 'Submit Request',
    sent: 'Request sent to chef!',
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    countered: 'Counter-Offer',
    counter_price: 'Counter Price',
    counter_date: 'Counter Date',
    accept: 'Accept',
    reject: 'Reject',
    respond: 'Respond',
    negotiable: 'Negotiable',
    min_notice: 'Minimum Notice',
  },

  // Specialties (Mode 3)
  specialties: {
    title: 'Specialties',
    preorder: 'Pre-Order',
    select_date: 'Select a Date',
    select_time: 'Select a Time',
    price_range: 'Price Range',
    prep_time: 'Prep Time',
    always: 'Always Available',
    seasonal: 'Seasonal',
    on_request: 'On Request',
    category: 'Category',
    submit: 'Submit Pre-Order',
  },

  // Flash Sales
  flash_sale: {
    title: 'Flash Sale',
    live: 'LIVE Flash Sales',
    select_post: 'Select Today\'s Post',
    discount: 'Discount Percentage',
    duration: 'Duration',
    preview: 'Preview',
    launch: 'Launch Flash Sale',
    off: 'OFF',
  },

  // Group Orders
  group_orders: {
    title: 'Group Orders',
    join: 'Join',
    invite_code: 'Invite Code',
    target: 'Target',
    reached: 'Target Reached!',
    time_left: 'left',
    join_code: 'Have an Invite Code?',
    progress: 'Progress',
  },

  // Subscriptions
  subscriptions: {
    title: 'Subscriptions',
    active: 'Active',
    paused: 'Paused',
    pause: 'Pause',
    resume: 'Resume',
    cancel_sub: 'Cancel Subscription',
    loyalty: 'loyalty discount',
    next_order: 'Next order',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
  },

  // Teasers
  teasers: {
    title: 'Coming Soon',
    interested: 'I\'m Interested!',
    publish: 'Publish Teaser',
    planned_date: 'Planned Date',
  },

  // Disputes
  disputes: {
    title: 'Disputes',
    open: 'Open a Dispute',
    reason: 'Reason',
    not_delivered: 'Order Not Delivered',
    wrong_order: 'Wrong Order',
    quality_issue: 'Quality Issue',
    late_delivery: 'Late Delivery',
    other: 'Other Issue',
    description: 'Describe what happened',
    submit: 'Submit Dispute',
    chef_response: 'Chef Response',
    resolution: 'Resolution',
  },

  // Settings
  settings: {
    title: 'Settings',
    dark_mode: 'Dark Mode',
    language: 'Language',
    order_updates: 'Order Updates',
    promotions: 'Promotions',
    messages: 'Messages',
    edit_profile: 'Edit Profile',
    my_addresses: 'My Addresses',
    privacy: 'Privacy',
    help: 'Help & Support',
    about: 'About',
    logout: 'Logout',
    delete_account: 'Delete Account',
  },

  // Addresses
  addresses: {
    title: 'My Addresses',
    add: 'Add Address',
    label: 'Label',
    full_address: 'Full Address',
    detect: 'Auto-detect Location',
    set_default: 'Set Default',
    default: 'DEFAULT',
  },

  // Help
  help: {
    title: 'Help & Support',
    contact: 'Contact Us',
    report: 'Report Issue',
    faq: 'Frequently Asked Questions',
    submit_report: 'Submit Report',
  },

  // Order Confirmation
  confirmation: {
    title: 'Order Confirmed!',
    order_number: 'Order Number',
    estimated_time: 'Estimated Time',
    track: 'Track My Order',
    back_home: 'Back to Home',
  },

  // Manage Post (Chef)
  manage_post: {
    title: 'Manage Post',
    sold_out: 'Mark Sold Out',
    orders_for_post: 'Orders for this post',
  },

  // Chef Reviews
  chef_reviews: {
    title: 'Reviews',
    reply: 'Reply',
    your_reply: 'Your Reply',
    filter_by: 'Filter by rating',
  },
};
