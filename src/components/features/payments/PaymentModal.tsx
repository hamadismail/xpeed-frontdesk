"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { DollarSign } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { Label } from "@/src/components/ui/label";
import { IBook, PAYMENT_METHOD } from "@/src/models/book.model";
// import { PaymentReceipt } from "@/src/components/layout/payment-receipt";
import { PaymentInvoice } from "../../layout/PaymentInvoice";

export default function PaymentModal({ guest }: { guest: IBook }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [formErrors, setFormErrors] = useState({ paidAmount: "" });

  const { data: singleGuest } = useQuery<IBook>({
    queryKey: ["books", guest._id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/stayover/${guest._id}`);
      return data;
    },
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paidAmount: "",
    remarks: "",
    paymentMethod: PAYMENT_METHOD.CASH,
  });

  const validateForm = () => {
    const errors = {
      paidAmount: !paymentInfo.paidAmount
        ? "Amount is required"
        : isNaN(Number(paymentInfo.paidAmount))
        ? "Must be a valid number"
        : "",
    };
    setFormErrors(errors);
    return !errors.paidAmount;
  };

  const { mutate: updateGuest, isPending } = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error("Please fix form errors");
      }
      const payload = {
        payment: {
          paidAmount: Number(paymentInfo.paidAmount),
          dueAmount: calculateDue(),
          paymentMethod: paymentInfo.paymentMethod,
        },
      };
      const { data } = await axios.patch(`/api/payments/${guest._id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: ["payments", "rooms"] });
      resetForm();
      setShowReceipt(true);
    },
    onError: (error: AxiosError) => {
      toast.error("Payment failed", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setPaymentInfo({
      paidAmount: "",
      remarks: "",
      paymentMethod: PAYMENT_METHOD.CASH,
    });
    setFormErrors({ paidAmount: "" });
  };

  const calculateDue = (): number => {
    const currentDue = singleGuest?.payment?.dueAmount || 0;
    const paymentAmount = Number(paymentInfo.paidAmount) || 0;
    return Math.max(0, currentDue - paymentAmount);
  };

  const totalDue = singleGuest?.payment?.dueAmount || 0;
  const currentDue = calculateDue();
  const paymentAmount = Number(paymentInfo.paidAmount) || 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setShowReceipt(false);
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="default"
          className="h-8 px-3 gap-1"
          aria-label="Make payment"
        >
          <DollarSign className="h-4 w-4" />
          <span>Payment</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        {showReceipt ? (
          <div className="grid gap-6 overflow-scroll max-h-80">
            <PaymentInvoice
              bookingInfo={{
                guest: {
                  name: singleGuest?.guest.name || "",
                  // email: singleGuest?.guest.email || "",
                  phone: singleGuest?.guest.phone || "",
                  // country: singleGuest?.guest.country || "",
                  // passport: singleGuest?.guest.passport || "",
                },
                stay: {
                  arrival: singleGuest?.stay.arrival
                    ? new Date(singleGuest.stay.arrival)
                    : new Date(),
                  departure: singleGuest?.stay.departure
                    ? new Date(singleGuest.stay.departure)
                    : new Date(),
                  // adults: singleGuest?.stay.adults || 0,
                  // children: singleGuest?.stay.children || 0,
                  // nights:
                  //   Math.ceil(
                  //     (new Date(
                  //       singleGuest?.stay.departure || new Date()
                  //     ).getTime() -
                  //       new Date(
                  //         singleGuest?.stay.arrival || new Date()
                  //       ).getTime()) /
                  //       (1000 * 60 * 60 * 24)
                  //   ) || 1,
                },
                room: {
                  number: (singleGuest?.roomId as unknown as string) || "",
                  type: "",
                  // floor: "",
                  // price: singleGuest?.payment?.roomPrice || 0,
                },
                payment: {
                  // subtotal: singleGuest?.payment?.subtotal || 0,
                  // sst: singleGuest?.payment?.sst || 0,
                  // tourismTax: singleGuest?.payment?.tourismTax || 0,
                  // discount: singleGuest?.payment?.discount || 0,
                  // total: singleGuest?.payment?.subtotal || 0,
                  paidAmount:
                    (singleGuest?.payment.paidAmount || 0) + paymentAmount,
                  // dueAmount: currentDue,
                  method: singleGuest?.payment?.paymentMethod || "Cash",
                  // paymentDate: new Date(),
                },
                paymentId: `PAY-${Date.now()
                  .toString(36)
                  .toUpperCase()}-${Math.random()
                  .toString(36)
                  .substring(2, 10)
                  .toUpperCase()}`,
                bookingDate: new Date(),
                // paymentId: `PAY-${Date.now()}`,
              }}
              onConfirmBooking={() => {
                setShowReceipt(false);
                setOpen(false);
              }}
              isBooking={isPending}
            />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-primary" />
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Payment Details
                  </DialogTitle>
                  <DialogDescription>
                    Record payment for guest
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Amount Paid *</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  value={paymentInfo.paidAmount}
                  onChange={(e) => {
                    setPaymentInfo({
                      ...paymentInfo,
                      paidAmount: e.target.value,
                    });
                    if (formErrors.paidAmount) {
                      setFormErrors({ paidAmount: "" });
                    }
                  }}
                  placeholder="0.00"
                  className={formErrors.paidAmount ? "border-destructive" : ""}
                  min="0"
                  step="0.01"
                />
                {formErrors.paidAmount && (
                  <p className="text-sm text-destructive">
                    {formErrors.paidAmount}
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  type="text"
                  value={paymentInfo.remarks}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      remarks: e.target.value,
                    })
                  }
                  placeholder="Type remarks"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2 col-span-2">
                <Label>Payment Method</Label>
                <div className="flex gap-4">
                  {Object.values(PAYMENT_METHOD).map((method) => (
                    <Button
                      key={method}
                      variant={
                        paymentInfo.paymentMethod === method
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setPaymentInfo({
                          ...paymentInfo,
                          paymentMethod: method,
                        })
                      }
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Due:</span>
                  <span className="font-bold text-destructive">
                    RM {totalDue.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Amount Paid:</span>
                  <span className="font-bold">
                    RM {paymentAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Remaining Due:</span>
                  <span
                    className={`font-bold ${
                      currentDue > 0 ? "text-destructive" : "text-green-600"
                    }`}
                  >
                    RM {currentDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {updateGuest()}}
                disabled={isPending || !paymentInfo.paidAmount}
                className="gap-1"
              >
                {isPending ? "Processing..." : "Submit Payment"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
