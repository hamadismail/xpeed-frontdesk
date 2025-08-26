"use client";

import { Button } from "../ui/button";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

interface InvoiceProps {
  bookingInfo: {
    guest: {
      name: string | undefined;
      phone: string | undefined;
    };
    stay: {
      arrival: Date | undefined;
      departure: Date | undefined;
    };
    room: {
      number: string | undefined;
      type: string | undefined;
    };
    payment: {
      paidAmount: number;
      method: string | undefined;
      remarks?: string | undefined;
    };
    bookingDate: Date;
    paymentId: string | undefined;
  };
  onConfirmBooking: () => void;
  isBooking: boolean;
}

export function PaymentInvoice({
  bookingInfo,
  onConfirmBooking,
  isBooking,
}: InvoiceProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
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
    onConfirmBooking();
    handlePrint();
  };

  const Receipt = ({ copyLabel }: { copyLabel: string }) => (
    <div className="border border-black p-4 mb-8">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">Eco Hotel @ Bukit Bintang</h2>
        <p className="text-sm">179, Jalan Pudu, Kuala Lumpur, Malaysia</p>
        <p className="text-sm">
          Phone: +601116962002 | Email: ecohotel.bb@gmail.com
        </p>
        <h3 className="text-md font-semibold mt-2 underline">
          Payment Receipt - {copyLabel}
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr>
            <td className="py-1">Room</td>
            <td className="py-1">
              : {bookingInfo.room.number} - {bookingInfo.room.type}
            </td>
            <td className="py-1">Receipt No.</td>
            <td className="py-1">: {bookingInfo.paymentId}</td>
          </tr>
          <tr>
            <td className="py-1">Guest Name</td>
            <td className="py-1">: {bookingInfo.guest.name}</td>
            <td className="py-1">Entered On</td>
            <td className="py-1">
              : {new Date(bookingInfo.bookingDate).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="py-1">Payment Date</td>
            <td className="py-1">
              : {new Date(bookingInfo.bookingDate).toLocaleDateString()}
            </td>
            <td className="py-1">Amount</td>
            <td className="py-1 font-bold">
              : RM {bookingInfo.payment.paidAmount.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td className="py-1">Pay Method</td>
            <td className="py-1">: {bookingInfo.payment.method}</td>
            <td className="py-1">Remark</td>
            <td className="py-1">: {bookingInfo.payment.remarks || "-"}</td>
          </tr>
          <tr>
            <td className="py-1">Notice</td>
            <td colSpan={3} className="py-1">
              Receipt NOTICE
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="grid grid-cols-3 text-center text-sm border-t mt-4 pt-2">
        <div>User: ShiftA</div>
        <div>Guest Signature</div>
        <div>Authorized Signatory</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-4 mb-6">
        <Button onClick={handleConfirmAndPrint} disabled={isBooking}>
          {isBooking ? "Processing..." : "Confirm & Print Receipt"}
        </Button>
      </div>

      {/* Print Area */}
      <div
        ref={contentRef}
        className="bg-white text-black p-6 max-w-3xl w-full"
      >
        <Receipt copyLabel="Hotel Copy" />
        <Receipt copyLabel="Guest Copy" />
      </div>
    </div>
  );
}
