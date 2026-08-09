export const Strings = {
  splashAccessibility: 'صفحه شروع ابر',
  logoAccessibility: 'لوگوی ابر',

  onboarding: {
    stepAccessibility: (current: number, total: number) =>
      `مرحله معرفی ${current} از ${total}`,
    getStarted: 'شروع کنید!',
    getStartedAccessibility: 'شروع کنید',
    steps: [
      {
        title: 'درخواست سفر',
        description:
          'درخواست سفر دهید تا توسط یک\nراننده محلی نزدیک سوار شوید',
      },
      {
        title: 'تأیید راننده',
        description:
          'شبکه بزرگ رانندگان کمک می‌کند\nسفری راحت، امن و مقرون‌به‌صرفه پیدا کنید',
      },
      {
        title: 'پیگیری سفر',
        description:
          'راننده خود را از قبل بشناسید و\nموقعیت لحظه‌ای را به‌صورت زنده\nروی نقشه ببینید',
      },
    ],
  },

  setupLocation: {
    title: 'سلام، از آشنایی با شما خوشحالم!',
    subtitle: 'موقعیت خود را انتخاب کنید تا\nرستوران‌های اطرافتان را پیدا کنید.',
    useCurrentLocation: 'استفاده از موقعیت فعلی',
    selectManually: 'انتخاب دستی',
    selectManuallyAccessibility: 'انتخاب موقعیت به‌صورت دستی',
    locationUnavailableTitle: 'موقعیت در دسترس نیست',
    locationSavedTitle: 'موقعیت ذخیره شد',
    locationSavedMessage: (lat: string, lng: string) =>
      `عرض جغرافیایی ${lat}\nطول جغرافیایی ${lng}`,
  },

  manualLocation: {
    title: 'انتخاب دستی موقعیت',
    body: 'انتخاب موقعیت روی نقشه در فاز بعدی پیاده‌سازی می‌شود.',
    accessibility: 'صفحه انتخاب دستی موقعیت',
  },

  locationErrors: {
    servicesDisabled:
      'سرویس موقعیت مکانی خاموش است. لطفاً GPS را از تنظیمات دستگاه فعال کنید.',
    permissionDenied:
      'دسترسی به موقعیت رد شد. برای ادامه، اجازه دسترسی به موقعیت را بدهید.',
    unavailable: 'دریافت موقعیت فعلی ممکن نشد. لطفاً دوباره تلاش کنید.',
  },
} as const;
