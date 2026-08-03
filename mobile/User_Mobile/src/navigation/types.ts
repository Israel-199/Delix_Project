export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  OtpVerification: { phone: string };
  CustomerHome: undefined;
  MapBooking: undefined;
  VehicleDetails: { vehicleId: string };
  CargoInfo: undefined;
  BookingSummary: undefined;
  DriverTracking: { orderId: string };
  DeliveryCompleted: { orderId: string };
};
