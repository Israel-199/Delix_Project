export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  OtpVerification: { phone: string };
  ProfileSetup: undefined;
  LocationPermission: undefined;
  CustomerHome: { openDrawer?: true } | undefined;
  VehicleDetails: { vehicleId: string };
  CargoInfo: undefined;
  BookingSummary: undefined;
  DriverTracking: { orderId: string };
  DeliveryCompleted: { orderId: string };
  MyProfile: undefined;
  MyDeliveries: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  About: undefined;
};

