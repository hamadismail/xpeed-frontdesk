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
import { IBook } from "@/src/models/book.model";

interface GuestPayment {
  _id: string;
  payment: {
    paidAmount: number;
    dueAmount: number;
  };
  roomId: string;
  createdAt: string;
}

export default function PaymentModal({ guest }: { guest: GuestPayment }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
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
          paidAmount:
            (singleGuest?.payment.paidAmount || 0) +
            Number(paymentInfo.paidAmount),
          dueAmount: calculateDue(),
        },
      };

      const { data } = await axios.patch(`/api/payments/${guest._id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      resetForm();
      setOpen(false);
    },
    onError: (error: AxiosError) => {
      toast.error("Payment failed", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setPaymentInfo({ paidAmount: "" });
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
    <Dialog open={open} onOpenChange={setOpen}>
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
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle className="text-xl font-bold">
                Payment Details
              </DialogTitle>
              <DialogDescription>Record payment for guest</DialogDescription>
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
                setPaymentInfo({ paidAmount: e.target.value });
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

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Due:</span>
              <span className="font-bold text-destructive">
                RM {totalDue.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount Paid:</span>
              <span className="font-bold">RM {paymentAmount.toFixed(2)}</span>
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
            onClick={() => updateGuest()}
            disabled={isPending || !paymentInfo.paidAmount}
            className="gap-1"
          >
            {isPending ? "Processing..." : "Submit Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
