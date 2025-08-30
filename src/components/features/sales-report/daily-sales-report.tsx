"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { IPayment } from "@/src/models/payment.model";
import { format } from "date-fns";
import { Button } from "@/src/components/ui/button";

interface DailySalesReportProps {
  payments: IPayment[];
  reportDate: Date;
}

export function DailySalesReport({
  payments,
  reportDate,
}: DailySalesReportProps) {
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 0.2in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        .print-button {
          display: none;
        }
        .invoice-container {
          box-shadow: none;
          border: 1px solid #eee;
        }
      }
    `,
  });

  const totalSales = payments.reduce(
    (acc, payment) => acc + payment.paidAmount,
    0
  );

  return (
    <div>
      <div ref={contentRef} className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Eco Hotel @ Bukit Bintang</h1>
          <p>Daily Sales Report</p>
          <p>{format(reportDate, "PPP")}</p>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Guest Name</th>
              <th className="text-left">Room No</th>
              <th className="text-left">Payment Date</th>
              <th className="text-left">Payment Method</th>
              <th className="text-right">Paid Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const guestObj = payment.guestId as {
                guest?: { name?: string };
                roomId?: { roomNo?: string };
              };
              const guestName = guestObj?.guest?.name || "N/A";
              const roomNo = guestObj?.roomId?.roomNo || "";
              return (
                <tr key={payment._id}>
                  <td>{guestName}</td>
                  <td>{roomNo}</td>
                  <td>{format(new Date(payment.paymentDate), "PPP")}</td>
                  <td>{payment.paymentMethod}</td>
                  <td className="text-right">
                    RM {payment.paidAmount.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right font-bold py-4">
                Total Sales
              </td>
              <td className="text-right font-bold py-4">
                RM {totalSales.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="text-center mt-4">
        <Button onClick={handlePrint}>Print Report</Button>
      </div>
    </div>
  );
}
