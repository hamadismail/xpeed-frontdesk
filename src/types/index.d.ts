export interface IReservation {
  guest: {
    reservationNo: string;
    ota: string;
    name: string;
    email?: string;
    phone: string;
    nationality?: string;
    passport?: string;
  };
  room: {
    roomNo?: string;
    numOfGuest?: string;
    arrival: Date;
    departure: Date;
    roomDetails?: string;
    otherGuest?: string;
  };
  payment: {
    bookingFee: number;
    sst: number;
    tourismTax: number;
    fnfDiscount: number;
    totalAmount: number;
  };
  reservationDate: string;
}
