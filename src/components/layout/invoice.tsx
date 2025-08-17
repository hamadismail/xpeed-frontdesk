"use client";

import { Button } from "../ui/button";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import {
  Hotel,
  BedSingle,
  BedDouble,
  Crown,
  Calendar as CalendarIcon,
  User,
  CreditCard,
} from "lucide-react";

interface InvoiceProps {
  bookingInfo: {
    guest: {
      name: string;
      email: string;
      phone: string;
      country: string;
      passport: string;
    };
    stay: {
      arrival: Date;
      departure: Date;
      adults: number;
      children: number;
      nights: number;
    };
    room: {
      number: string;
      type: string;
      floor: string;
      price: number;
    };
    payment: {
      subtotal: number;
      sst: number;
      tourismTax: number;
      discount: number;
      total: number;
      paidAmount: number;
      dueAmount: number;
      method: string;
    };
    bookingDate: Date;
    bookingId: string;
  };
  onConfirmBooking: () => void;
  isBooking: boolean;
}

export function Invoice({
  bookingInfo,
  onConfirmBooking,
  isBooking,
}: InvoiceProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  // const contentRef = useRef();

  const handlePrint = useReactToPrint({
    // content: () => invoiceRef.current,
    contentRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        @page {
          margin: 0;
          size: auto;
        }
        @page :footer { display: none; }
        @page :header { display: none; }
      }
    `,
  });

  const handleConfirmAndPrint = () => {
    // First confirm booking, then print
    onConfirmBooking();
    handlePrint();
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "Single":
        return <BedSingle className="h-5 w-5" />;
      case "Twin":
        return <BedDouble className="h-5 w-5" />;
      case "Queen":
        return <Crown className="h-5 w-5" />;
      case "Suite":
        return <Hotel className="h-5 w-5" />;
      default:
        return <BedSingle className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-4 mb-6">
        {/* <Button onClick={handlePrint} variant="outline">
          Print Invoice First
        </Button> */}
        <Button onClick={handleConfirmAndPrint} disabled={isBooking}>
          {isBooking ? "Processing..." : "Confirm & Print Invoice"}
        </Button>
      </div>

      <div
        ref={contentRef}
        className="bg-white text-gray-800 p-8 max-w-3xl w-full"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hotel className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Eco Hotel @ Bukit Bintang</h1>
            </div>
            <p className="text-muted-foreground">
              179, Jalan Pudu, Pudu-55100 Kuala Lumpur, Malaysia
            </p>
            <p className="text-muted-foreground">
              Phone: +601116962002, +60178988418 | Email:
              ecohotel.bb@gmail.com
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold text-primary">INVOICE</h2>
            <p className="text-sm text-muted-foreground">
              #{bookingInfo.bookingId}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(bookingInfo.bookingDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Guest and Booking Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
              <User className="h-5 w-5 text-primary" />
              Guest Information
            </h3>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {bookingInfo.guest.name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {bookingInfo.guest.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {bookingInfo.guest.phone}
              </p>
              <p>
                <span className="font-medium">Country:</span>{" "}
                {bookingInfo.guest.country}
              </p>
              <p>
                <span className="font-medium">Passport/ID:</span>{" "}
                {bookingInfo.guest.passport}
              </p>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Booking Details
            </h3>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Dates:</span>{" "}
                {bookingInfo.stay.arrival.toLocaleDateString()} -{" "}
                {bookingInfo.stay.departure.toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Duration:</span>{" "}
                {bookingInfo.stay.nights} nights
              </p>
              <p>
                <span className="font-medium">Guests:</span>{" "}
                {bookingInfo.stay.adults} adult
                {bookingInfo.stay.adults !== 1 ? "s" : ""}
                {bookingInfo.stay.children > 0 &&
                  `, ${bookingInfo.stay.children} child${
                    bookingInfo.stay.children !== 1 ? "ren" : ""
                  }`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {getRoomIcon(bookingInfo.room.type)}
                <span className="font-medium capitalize">
                  {bookingInfo.room.type}
                </span>
                <span>• Room {bookingInfo.room.number}</span>
                <span>• Floor {bookingInfo.room.floor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Booking Summary</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4">
                    Room ({bookingInfo.room.type}) × {bookingInfo.stay.nights}{" "}
                    nights
                  </td>
                  <td className="text-right py-3 px-4">
                    RM {bookingInfo.room.price.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">
                    SST ({bookingInfo.payment.sst}%)
                  </td>
                  <td className="text-right py-3 px-4">
                    RM{" "}
                    {(
                      (bookingInfo.payment.subtotal * bookingInfo.payment.sst) /
                      100
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Tourism Tax (per night)</td>
                  <td className="text-right py-3 px-4">
                    RM {bookingInfo.payment.tourismTax.toFixed(2)}
                  </td>
                </tr>
                {bookingInfo.payment.discount > 0 && (
                  <tr className="border-b">
                    <td className="py-3 px-4">Discount</td>
                    <td className="text-right py-3 px-4 text-red-500">
                      - RM {bookingInfo.payment.discount.toFixed(2)}
                    </td>
                  </tr>
                )}

                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Subtotal</td>
                  <td className="text-right py-3 px-4">
                    RM {bookingInfo.payment.total.toFixed(2)}
                  </td>
                </tr>

                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Due Amount</td>
                  <td className="text-right py-3 px-4 text-red-500">
                    - RM {bookingInfo.payment.dueAmount.toFixed(2)}
                  </td>
                </tr>

                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Total Paid</td>
                  <td className="text-right py-3 px-4">
                    RM {bookingInfo.payment.paidAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Method
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="capitalize">{bookingInfo.payment.method}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Paid on {new Date(bookingInfo.bookingDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          <p>Thank you for choosing Eco Hotel @ Bukit Bintang!</p>
          {/* <p className="mt-1">
            For any inquiries, please contact reservations@xpeedholiday.com
          </p>
          <p className="mt-4 text-xs">
            This is an automated invoice. No signature required.
          </p> */}
        </div>
      </div>
    </div>
  );
}
