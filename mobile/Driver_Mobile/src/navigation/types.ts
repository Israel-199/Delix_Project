export type DriverStackParamList = {
  DriverSplash: undefined;
  DriverLogin: undefined;
  DriverOtp: { phone: string };
  DriverRegister: undefined;
  DriverHome: undefined;
  DriverTrips: undefined;
  DriverDocuments: undefined;
  DriverProfile: { isOnline?: boolean } | undefined;
  DriverNotifications: undefined;
};
