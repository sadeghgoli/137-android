export const Strings = {
  brand: {
    system: 'سامانه ۱۳۷',
    city: 'سبزوار من',
    municipality: 'شهرداری سبزوار',
  },

  splashAccessibility: 'صفحه شروع سامانه ۱۳۷ سبزوار',
  logoAccessibility: 'لوگوی سامانه',

  onboarding: {
    next: 'بعدی',
    enter: 'ورود به سامانه',
    dontShowAgain: 'دیگر این راهنما را نمایش نده',
    stepAccessibility: (current: number, total: number) =>
      `مرحله راهنما ${current} از ${total}`,
    steps: [
      {
        title: 'ثبت درخواست',
        description:
          'مشکلات شهری خود را به‌سادگی ثبت کنید\nو پیگیری آن‌ها را از همینجا انجام دهید',
      },
      {
        title: 'انتخاب موقعیت روی نقشه',
        description:
          'محل مربوط به درخواست را روی نقشه\nسبزوار مشخص کنید',
      },
      {
        title: 'پیگیری درخواست',
        description:
          'با کد پیگیری، وضعیت و آخرین پاراف\nدرخواست خود را مشاهده کنید',
      },
      {
        title: 'اطلاع‌رسانی',
        description:
          'از تغییر وضعیت درخواست‌ها\nاز طریق اعلان‌ها مطلع شوید',
      },
    ],
  },

  login: {
    title: 'ورود به سامانه',
    subtitle: 'ورود از portal احراز هویت یا با کد ملی',
    portalButton: 'ورود از auth.sabzevar.ir',
    portalLoading: 'در حال باز کردن portal...',
    button: 'ادامه با کد ملی',
    ssoHint: 'ورود کد ملی همان سرویس SSO شهرداری (auth.sabzevar.ir) است',
    loading: 'در حال بررسی...',
    melliPlaceholder: 'کد ملی ۱۰ رقمی',
    melliRequired: 'کد ملی را وارد کنید',
    melliInvalid: 'کد ملی باید ۱۰ رقم باشد',
    selectPhoneTitle: 'انتخاب شماره موبایل',
    selectPhoneSubtitle: 'شماره‌ای که کد تایید به آن ارسال شود را انتخاب کنید',
    sendOtp: 'ارسال کد تایید',
    otpTitle: 'کد تایید',
    otpSubtitle: 'کد ارسال‌شده به شماره زیر را وارد کنید',
    otpPlaceholder: 'کد ۵ رقمی',
    otpRequired: 'کد تایید را وارد کنید',
    verifyOtp: 'تایید و ورود',
    resendOtp: 'ارسال مجدد کد',
    moiButton: 'ورود با پنجره ملی خدمات',
    moiLoading: 'در حال انتقال به وزارت کشور...',
  },

  home: {
    myRequests: 'درخواست‌های من',
    newRequestHint: 'برای ثبت درخواست، روی نقشه ضربه بزنید',
    profileAccessibility: 'پروفایل شهروند',
    notificationsAccessibility: 'اعلان‌ها',
    recenterAccessibility: 'بازگشت به مرکز نقشه',
    requestSummary: 'مشاهده پیگیری',
    selectedLocation: 'موقعیت انتخاب‌شده',
    selectedAddress: 'آدرس انتخاب‌شده',
    resolvingLocation: 'در حال یافتن آدرس...',
    addressUnavailable: 'آدرس یافت نشد',
    demoVehicleOn: 'حرکت آزمایشی: روشن',
    demoVehicleOff: 'حرکت آزمایشی: خاموش',
  },

  requestForm: {
    title: 'ثبت درخواست جدید',
    descriptionLabel: 'شرح درخواست',
    descriptionPlaceholder: 'شرح مشکل یا درخواست خود را بنویسید...',
    attachments: 'پیوست‌ها',
    addAttachment: 'افزودن تصویر',
    submit: 'ارسال درخواست',
    descriptionRequired: 'لطفاً شرح درخواست را وارد کنید',
    selectedAddressLabel: 'محل درخواست',
    cancel: 'انصراف',
  },

  requestSuccess: {
    title: 'درخواست با موفقیت ثبت شد',
    trackingLabel: 'کد پیگیری شما',
    smsHint: 'کد پیگیری همزمان از طریق پیامک نیز ارسال شد.',
    viewRequests: 'مشاهده درخواست‌های من',
    backHome: 'بازگشت به نقشه',
  },

  requests: {
    title: 'درخواست‌های من',
    empty: 'هنوز درخواستی ثبت نشده است.',
    trackingCode: 'کد پیگیری',
  },

  notifications: {
    title: 'اعلان‌ها',
    empty: 'اعلانی وجود ندارد.',
  },

  requestDetail: {
    title: 'پیگیری درخواست',
    status: 'وضعیت فعلی',
    location: 'محل درخواست',
    description: 'شرح درخواست',
    attachments: 'فایل‌های ضمیمه',
    history: 'تاریخچه تغییرات',
    source: 'نحوه ثبت',
    date: 'تاریخ ثبت',
    noAttachments: 'پیوستی وجود ندارد',
  },

  profile: {
    title: 'پروفایل شهروند',
    firstName: 'نام',
    lastName: 'نام خانوادگی',
    nationalId: 'کد ملی',
    mobile: 'شماره موبایل',
    landline: 'تلفن ثابت',
    landlineEmpty: 'هنوز تلفن ثابتی ثبت نشده است',
    addLandline: 'افزودن شماره تلفن ثابت',
    verified: 'تأیید شده',
    pending: 'در انتظار تأیید',
    logout: 'خروج از حساب',
    readOnlyHint: 'اطلاعات هویتی از سامانه احراز هویت دریافت شده و قابل ویرایش نیست.',
  },

  landline: {
    title: 'ثبت تلفن ثابت',
    subtitle:
      'با تأیید تلفن ثابت، درخواست‌های ثبت‌شده از طریق تماس با ۱۳۷ نیز به حساب شما متصل می‌شوند.',
    placeholder: 'شماره تلفن ثابت',
    continue: 'ادامه',
    required: 'لطفاً شماره تلفن ثابت را وارد کنید',
    invalid: 'شماره تلفن ثابت معتبر نیست',
    verifyingTitle: 'احراز تلفن ثابت',
    verifyingMessage: 'در حال برقراری تماس با شماره شما...',
    verifyingHint: 'لطفاً منتظر بمانید. این فرآیند ممکن است چند لحظه طول بکشد.',
    successTitle: 'شماره تأیید شد',
    successMessage: 'تلفن ثابت با موفقیت احراز و به پروفایل شما اضافه شد.',
    failTitle: 'احراز ناموفق',
    failMessage: 'احراز شماره انجام نشد. می‌توانید دوباره تلاش کنید.',
    retry: 'تلاش مجدد',
    done: 'بازگشت به پروفایل',
  },

  common: {
    back: 'بازگشت',
    ok: 'باشه',
    error: 'خطا',
  },
} as const;
