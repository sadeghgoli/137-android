export type AuthPhoneOption = {
  id: number;
  phoneNumber: string;
  isPrimary?: boolean;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  SelectPhone: {
    melliCode: string;
    phones: AuthPhoneOption[];
  };
  VerifyOtp: {
    melliCode: string;
    phoneNumber: string;
    demoCode?: string;
  };
  Home: undefined;
  Profile: undefined;
  AddLandline: undefined;
  LandlineVerify: { phone: string };
  MyRequests: undefined;
  Notifications: undefined;
  RequestDetail: { requestId: string };
  NewRequest: {
    latitude: number;
    longitude: number;
    addressLabel?: string;
  };
  RequestSuccess: {
    trackingCode: string;
    requestId: string;
  };
};
