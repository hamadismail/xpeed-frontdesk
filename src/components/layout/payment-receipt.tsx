"use client";

import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import {
  Hotel,
  Calendar as CalendarIcon,
  User,
  CreditCard,
} from "lucide-react";

interface PaymentReceiptProps {
  paymentInfo: {
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
      paymentDate: Date;
    };
    bookingId: string;
    paymentId: string;
  };
  onPrint?: () => void;
}

export function PaymentReceipt({
  paymentInfo,
  onPrint,
}: PaymentReceiptProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    onAfterPrint: onPrint,
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

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-4 mb-6">
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          Print Receipt
        </button>
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
              Phone: +601116962002, +60178988418 | Email: ecohotel.bb@gmail.com
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold text-primary">PAYMENT RECEIPT</h2>
            <p className="text-sm text-muted-foreground">
              Receipt #{paymentInfo.paymentId}
            </p>
            <p className="text-sm text-muted-foreground">
              Booking #{paymentInfo.bookingId}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(paymentInfo.payment.paymentDate).toLocaleDateString("en-US", {
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
                {paymentInfo.guest.name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {paymentInfo.guest.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {paymentInfo.guest.phone}
              </p>
              <p>
                <span className="font-medium">Country:</span>{" "}
                {paymentInfo.guest.country}
              </p>
              <p>
                <span className="font-medium">Passport/ID:</span>{" "}
                {paymentInfo.guest.passport}
              </p>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Stay Details
            </h3>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Dates:</span>{" "}
                {paymentInfo.stay.arrival.toLocaleDateString()} -{" "}
                {paymentInfo.stay.departure.toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Duration:</span>{" "}
                {paymentInfo.stay.nights} nights
              </p>
              <p>
                <span className="font-medium">Guests:</span>{" "}
                {paymentInfo.stay.adults} adult
                {paymentInfo.stay.adults !== 1 ? "s" : ""}
                {paymentInfo.stay.children > 0 &&
                  `, ${paymentInfo.stay.children} child${
                    paymentInfo.stay.children !== 1 ? "ren" : ""
                  }`}
              </p>
              <p>
                <span className="font-medium">Room:</span> Room {paymentInfo.room.number} • Floor {paymentInfo.room.floor}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
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
                    Room ({paymentInfo.room.type}) × {paymentInfo.stay.nights}{" "}
                    nights
                  </td>
                  <td className="text-right py-3 px-4">
                    RM {paymentInfo.room.price.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">
                    SST ({paymentInfo.payment.sst}%)
                  </td>
                  <td className="text-right py-3 px-4">
                    RM{" "}
                    {(
                      (paymentInfo.payment.subtotal * paymentInfo.payment.sst) /
                      100
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Tourism Tax (per night)</td>
                  <td className="text-right py-3 px-4">
                    RM {paymentInfo.payment.tourismTax.toFixed(2)}
                  </td>
                </tr>
                {paymentInfo.payment.discount > 0 && (
                  <tr className="border-b">
                    <td className="py-3 px-4">Discount</td>
                    <td className="text-right py-3 px-4 text-red-500">
                      - RM {paymentInfo.payment.discount.toFixed(2)}
                    </td>
                  </tr>
                )}

                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Total Amount</td>
                  <td className="text-right py-3 px-4">
                    RM {paymentInfo.payment.total.toFixed(2)}
                  </td>
                </tr>

                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Amount Paid</td>
                  <td className="text-right py-3 px-4">
                    RM {paymentInfo.payment.paidAmount.toFixed(2)}
                  </td>
                </tr>

                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Remaining Balance</td>
                  <td className="text-right py-3 px-4 text-red-500">
                    RM {paymentInfo.payment.dueAmount.toFixed(2)}
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
            <p className="capitalize">{paymentInfo.payment.method}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Paid on {new Date(paymentInfo.payment.paymentDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          <p>Thank you for choosing Eco Hotel @ Bukit Bintang!</p>
          <p className="mt-1">
            For any inquiries, please contact ecohotel.bb@gmail.com
          </p>
          <p className="mt-4 text-xs">
            This is an automated receipt. No signature required.
          </p>
        </div>
      </div>
    </div>
  );
}
