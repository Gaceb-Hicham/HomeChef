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

  // Prep Requests (Mode 2)
  prep: {
    title: 'طلب تحضير',
    menu: 'قائمة التحضير',
    request: 'طلب',
    requests: 'طلبات التحضير',
    date: 'متى تريده؟',
    quantity: 'الكمية',
    your_offer: 'عرضك',
    instructions: 'تعليمات خاصة',
    summary: 'ملخص الطلب',
    submit: 'إرسال الطلب',
    sent: 'تم إرسال الطلب للطباخ!',
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    countered: 'عرض مضاد',
    counter_price: 'السعر المضاد',
    counter_date: 'التاريخ المضاد',
    accept: 'قبول',
    reject: 'رفض',
    respond: 'الرد',
    negotiable: 'قابل للتفاوض',
    min_notice: 'الحد الأدنى للإشعار',
  },

  // Specialties (Mode 3)
  specialties: {
    title: 'التخصصات',
    preorder: 'طلب مسبق',
    select_date: 'اختر تاريخ',
    select_time: 'اختر وقت',
    price_range: 'نطاق السعر',
    prep_time: 'وقت التحضير',
    always: 'متاح دائماً',
    seasonal: 'موسمي',
    on_request: 'حسب الطلب',
    category: 'الفئة',
    submit: 'تأكيد الطلب المسبق',
  },

  // Flash Sales
  flash_sale: {
    title: 'تخفيض سريع',
    live: 'تخفيضات مباشرة',
    select_post: 'اختر منشور اليوم',
    discount: 'نسبة الخصم',
    duration: 'المدة',
    preview: 'معاينة',
    launch: 'إطلاق التخفيض',
    off: 'خصم',
  },

  // Group Orders
  group_orders: {
    title: 'طلبات جماعية',
    join: 'انضمام',
    invite_code: 'رمز الدعوة',
    target: 'الهدف',
    reached: 'تم الوصول للهدف!',
    time_left: 'متبقي',
    join_code: 'لديك رمز دعوة؟',
    progress: 'التقدم',
  },

  // Subscriptions
  subscriptions: {
    title: 'الاشتراكات',
    active: 'نشطة',
    paused: 'متوقفة',
    pause: 'إيقاف',
    resume: 'استئناف',
    cancel_sub: 'إلغاء الاشتراك',
    loyalty: 'خصم الولاء',
    next_order: 'الطلب القادم',
    weekly: 'أسبوعي',
    biweekly: 'كل أسبوعين',
  },

  // Teasers
  teasers: {
    title: 'قريباً',
    interested: 'أنا مهتم!',
    publish: 'نشر الإعلان',
    planned_date: 'التاريخ المخطط',
  },

  // Disputes
  disputes: {
    title: 'النزاعات',
    open: 'فتح نزاع',
    reason: 'السبب',
    not_delivered: 'لم يتم التوصيل',
    wrong_order: 'طلب خاطئ',
    quality_issue: 'مشكلة في الجودة',
    late_delivery: 'تأخر في التوصيل',
    other: 'مشكلة أخرى',
    description: 'اشرح ما حدث',
    submit: 'إرسال النزاع',
    chef_response: 'رد الطباخ',
    resolution: 'الحل',
  },

  // Settings
  settings: {
    title: 'الإعدادات',
    dark_mode: 'الوضع الداكن',
    language: 'اللغة',
    order_updates: 'تحديثات الطلبات',
    promotions: 'العروض',
    messages: 'الرسائل',
    edit_profile: 'تعديل الملف',
    my_addresses: 'عناويني',
    privacy: 'الخصوصية',
    help: 'المساعدة والدعم',
    about: 'عن التطبيق',
    logout: 'تسجيل الخروج',
    delete_account: 'حذف الحساب',
  },

  // Addresses
  addresses: {
    title: 'عناويني',
    add: 'إضافة عنوان',
    label: 'التسمية',
    full_address: 'العنوان الكامل',
    detect: 'تحديد الموقع تلقائياً',
    set_default: 'تعيين كافتراضي',
    default: 'الافتراضي',
  },

  // Help
  help: {
    title: 'المساعدة والدعم',
    contact: 'اتصل بنا',
    report: 'إبلاغ عن مشكلة',
    faq: 'الأسئلة الشائعة',
    submit_report: 'إرسال البلاغ',
  },

  // Order Confirmation
  confirmation: {
    title: 'تم تأكيد الطلب!',
    order_number: 'رقم الطلب',
    estimated_time: 'الوقت المتوقع',
    track: 'تتبع طلبي',
    back_home: 'العودة للرئيسية',
  },

  // Manage Post (Chef)
  manage_post: {
    title: 'إدارة المنشور',
    sold_out: 'تحديد كمباع',
    orders_for_post: 'طلبات هذا المنشور',
  },

  // Chef Reviews
  chef_reviews: {
    title: 'التقييمات',
    reply: 'الرد',
    your_reply: 'ردك',
    filter_by: 'تصفية حسب التقييم',
  },
};
