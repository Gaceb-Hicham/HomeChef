export default {
  // Common
  app_name: 'هوم شاف',
  loading: 'جاري التحميل...',
  error: 'خطأ',
  retry: 'إعادة المحاولة',
  cancel: 'إلغاء',
  save: 'حفظ',
  done: 'تم',
  confirm: 'تأكيد',
  delete: 'حذف',
  edit: 'تعديل',
  search: 'بحث',
  see_all: 'عرض الكل',
  back: 'رجوع',
  close: 'إغلاق',
  or: 'أو',
  and: 'و',

  // Auth
  auth: {
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    phone: 'رقم الهاتف',
    forgot_password: 'نسيت كلمة المرور؟',
    otp_title: 'أدخل رمز التحقق',
    otp_subtitle: 'أرسلنا رمز مكون من 6 أرقام إلى هاتفك',
    resend: 'إعادة إرسال الرمز',
    welcome_back: 'مرحبا بعودتك',
    create_account: 'إنشاء حساب جديد',
    role_customer: 'أريد طلب الطعام',
    role_chef: 'أريد الطبخ والبيع',
  },

  // Home
  home: {
    good_morning: 'صباح الخير',
    good_afternoon: 'مساء الخير',
    good_evening: 'مساء الخير',
    todays_specials: 'عروض اليوم',
    categories: {
      all: 'الكل',
      meals: '🍲 وجبات',
      desserts: '🍰 حلويات',
      salads: '🥗 سلطات',
      bakery: '🍞 مخبوزات',
      drinks: '🥤 مشروبات',
    },
    left: 'متبقي',
  },

  // Search
  search_screen: {
    placeholder: 'ابحث عن أطباق، طباخين...',
    recent: 'الأخيرة',
    trending: 'الأكثر رواجاً',
    nearby_chefs: 'طباخين قريبين',
    clear: 'مسح',
    no_results: 'لا توجد نتائج',
  },

  // Cart
  cart: {
    title: 'سلة التسوق',
    empty: 'سلتك فارغة',
    empty_subtitle: 'استكشف أطباق منزلية لذيذة بالقرب منك',
    subtotal: 'المجموع الفرعي',
    delivery_fee: 'رسوم التوصيل',
    total: 'المجموع',
    checkout: 'إتمام الطلب',
    remove: 'إزالة',
    browse: 'تصفح الأطباق',
  },

  // Orders
  orders: {
    title: 'طلباتي',
    active: 'نشطة',
    past: 'سابقة',
    no_active: 'لا توجد طلبات نشطة',
    no_past: 'لا توجد طلبات سابقة',
    track: 'تتبع الطلب',
    leave_review: 'اترك تقييم',
    status: {
      received: 'تم الاستلام',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      out_for_delivery: 'في الطريق',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
    },
  },

  // Tracking
  tracking: {
    title: 'تتبع الطلب',
    eta: 'الوقت المتوقع للوصول',
    contact_chef: 'اتصل بالطباخ',
    live: 'مباشر',
    now: 'الآن',
    steps: {
      received: 'تم تأكيد طلبك',
      preparing: 'الطباخ يحضر طعامك',
      ready: 'طلبك جاهز',
      out_for_delivery: 'طعامك في الطريق إليك',
      delivered: 'بالصحة والعافية!',
    },
  },

  // Checkout
  checkout: {
    title: 'إتمام الطلب',
    delivery_method: 'طريقة التوصيل',
    delivery: 'توصيل',
    pickup: 'استلام',
    address: 'عنوان التوصيل',
    time_slot: 'الوقت',
    payment: 'طريقة الدفع',
    card: 'بطاقة',
    cash: 'نقدي',
    note: 'ملاحظة للطباخ (اختياري)',
    note_placeholder: 'أي طلبات خاصة...',
    summary: 'ملخص الطلب',
    place_order: 'تأكيد الطلب',
    order_placed: 'تم الطلب! 🎉',
    order_confirmed: 'تم تأكيد طلبك بنجاح.',
    view_orders: 'عرض الطلبات',
  },

  // Chef Dashboard
  chef: {
    welcome_back: 'مرحبا بعودتك',
    kitchen_open: 'مطبخك مفتوح',
    kitchen_closed: 'مطبخك مغلق',
    open: 'فتح',
    close: 'إغلاق',
    todays_orders: 'طلبات اليوم',
    todays_revenue: 'إيرادات اليوم',
    pending: 'قيد الانتظار',
    avg_rating: 'متوسط التقييم',
    post_special: 'نشر طبق اليوم',
    recent_orders: 'آخر الطلبات',
    view_all: 'عرض الكل',
    mark_as: 'تحديد كـ',
  },

  // Create Post
  create_post: {
    title: 'نشر طبق خاص',
    dish_name: 'اسم الطبق',
    description: 'الوصف',
    price: 'السعر (د.ج)',
    quantity: 'الكمية',
    deadline: 'آخر موعد للطلب',
    delivery_available: 'التوصيل متاح',
    pickup_available: 'الاستلام متاح',
    allow_preorder: 'السماح بالطلب المسبق',
    publish: 'نشر الطبق',
    published: 'تم النشر! 🎉',
    published_message: 'طبقك اليومي متاح الآن.',
    add_photos: 'أضف صور (حتى 5)',
  },

  // Earnings
  earnings: {
    title: 'الأرباح',
    today: 'اليوم',
    this_week: 'هذا الأسبوع',
    this_month: 'هذا الشهر',
    total_revenue: 'إجمالي الإيرادات',
    orders_completed: 'الطلبات المكتملة',
    avg_per_order: 'المتوسط لكل طلب',
    payout_status: 'حالة الدفع',
    request_payout: 'طلب سحب',
    revenue_breakdown: 'تفصيل الإيرادات',
  },

  // Profile
  profile: {
    title: 'الملف الشخصي',
    edit: 'تعديل الملف',
    settings: 'الإعدادات',
    language: 'اللغة',
    notifications_setting: 'الإشعارات',
    help: 'المساعدة والدعم',
    about: 'عن هوم شاف',
    terms: 'شروط الاستخدام',
    privacy: 'سياسة الخصوصية',
    delete_account: 'حذف الحساب',
  },

  // Notifications
  notifications: {
    title: 'الإشعارات',
    read_all: 'قراءة الكل',
    empty: 'لا توجد إشعارات بعد',
  },

  // Saved
  saved: {
    title: 'المحفوظات',
    dishes: 'الأطباق',
    chefs: 'الطباخين',
  },

  // Review
  review: {
    title: 'كتابة تقييم',
    overall: 'التقييم العام',
    taste: 'المذاق',
    packaging: 'التغليف',
    accuracy: 'الدقة',
    comment: 'تقييمك',
    submit: 'إرسال التقييم',
    thanks: 'شكراً على تقييمك!',
  },
};
