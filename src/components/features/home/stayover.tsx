"use client";

import { useEffect, useState } from "react";
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
import { ArrowLeft, BedDouble, Calendar } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { IRoom } from "@/src/models/room.model";
import { Calendar as DatePicker } from "@/src/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";
import { IBook, PAYMENT_METHOD } from "@/src/models/book.model";
import { getRoomIcon } from "@/src/utils/getRoomIcon";
import { PaymentInvoice } from "../../layout/PaymentInvoice";
import { useInvalidateBookingQueries } from "@/src/hooks/useQuery";

export default function StayOver({ room }: { room: IRoom }) {
  const invalidate = useInvalidateBookingQueries();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formErrors, setFormErrors] = useState({
    departure: "",
    paidAmount: "",
  });

  const { data: singleGuest } = useQuery<IBook>({
    queryKey: ["books", room?.guestId?._id],
    queryFn: () =>
      axios.get(`/api/stayover/${room?.guestId?._id}`).then((res) => res.data),
    enabled: !!room?.guestId?._id, // only fetch if guestId exists
  });

  const [stayInfo, setStayInfo] = useState({
    arrival: undefined as Date | undefined,
    departure: undefined as Date | undefined,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paidAmount: "",
    discount: "",
    remarks: "",
    paymentMethod: PAYMENT_METHOD.CASH,
  });

  const validateForm = () => {
    const errors = {
      departure: !stayInfo.departure ? "Check out date is required" : "",
      paidAmount: !paymentInfo.paidAmount
        ? "Paid amount is required"
        : isNaN(Number(paymentInfo.paidAmount))
        ? "Must be a valid number"
        : "",
    };
    setFormErrors(errors);
    return !errors.departure && !errors.paidAmount;
  };

  const { mutate: updateGuest, isPending } = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error("Please fix form errors");
      }

      const payload = {
        bookingInfo: {
          stay: {
            // arrival: stayInfo.arrival || new Date(),
            departure: stayInfo.departure,
          },
          payment: {
            paidAmount: parseFloat(paymentInfo.paidAmount) || 0,
            subtotal: calculateSubTotal(),
            dueAmount: calculateDue(),
            paymentMethod: paymentInfo.paymentMethod,
          },
        },
      };

      const res = await axios.patch(
        `/api/stayover/${room?.guestId?._id}`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Guest Stayed Over successfully!");
      invalidate();
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Booking failed", {
        description: error?.message || "Something went wrong",
      });
    },
  });

  const resetForm = () => {
    setStayInfo({
      arrival: undefined,
      departure: undefined,
    });
    setPaymentInfo({
      paidAmount: "",
      discount: "",
      remarks: "",
      paymentMethod: PAYMENT_METHOD.CASH,
    });
    setFormErrors({
      departure: "",
      paidAmount: "",
    });
  };

  useEffect(() => {
    if (singleGuest?.stay?.departure) {
      setStayInfo((prev) => ({
        ...prev,
        arrival: new Date(singleGuest.stay.departure),
      }));
    }
  }, [singleGuest]);

  const calculateNights = () => {
    if (stayInfo.arrival && stayInfo.departure) {
      const diffTime = Math.abs(
        stayInfo.departure.getTime() - stayInfo.arrival.getTime()
      );
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }
    return 0;
  };

  const calculateTotal = () => {
    const night = calculateNights();
    const roomPrice = night * (singleGuest?.payment?.roomPrice || 0);
    return roomPrice + (singleGuest?.payment?.dueAmount || 0);
  };

  const calculateSubTotal = () => {
    const night = calculateNights();
    const roomPrice = night * (singleGuest?.payment?.roomPrice || 0);
    return roomPrice + (singleGuest?.payment?.subtotal || 0);
  };

  const calculateDue = () => {
    return Math.max(
      0,
      calculateTotal() -
        (parseFloat(paymentInfo.paidAmount || "0") +
          parseFloat(paymentInfo.discount || "0"))
    );
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1">
          <BedDouble className="h-4 w-4" />
          <span>Stayover</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getRoomIcon(room.roomType)}
            <div>
              <DialogTitle className="text-xl font-bold">
                Stay Over {room.roomNo}
              </DialogTitle>
              <DialogDescription className="capitalize">
                {room.roomType} • Floor {room.roomFloor}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 1 && (
          <>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                {/* New chekout date */}
                <div className="space-y-2">
                  <Label>New Check Out Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !stayInfo.departure && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {stayInfo.departure ? (
                          format(stayInfo.departure, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 max-h-[280px] overflow-auto">
                      <DatePicker
                        mode="single"
                        selected={stayInfo.departure}
                        onSelect={(date) => {
                          setStayInfo({
                            ...stayInfo,
                            departure: date ?? undefined,
                          });
                          if (formErrors.departure) {
                            setFormErrors({
                              ...formErrors,
                              departure: "",
                            });
                          }
                        }}
                        disabled={{
                          before: singleGuest?.stay.departure || new Date(),
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {formErrors.departure && (
                    <p className="text-sm text-red-500">
                      {formErrors.departure}
                    </p>
                  )}
                </div>

                {/* Paid Amount */}
                <div className="space-y-2">
                  <Label>Paid Amount *</Label>
                  <Input
                    type="number"
                    value={paymentInfo.paidAmount}
                    onChange={(e) => {
                      setPaymentInfo({
                        ...paymentInfo,
                        paidAmount: e.target.value,
                      });
                      if (formErrors.paidAmount) {
                        setFormErrors({
                          ...formErrors,
                          paidAmount: "",
                        });
                      }
                    }}
                    placeholder="0.00"
                    className={formErrors.paidAmount ? "border-red-500" : ""}
                  />
                  {formErrors.paidAmount && (
                    <p className="text-sm text-red-500">
                      {formErrors.paidAmount}
                    </p>
                  )}
                </div>

                {/* Discount */}
                <div className="space-y-2">
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    value={paymentInfo.discount}
                    onChange={(e) =>
                      setPaymentInfo({
                        ...paymentInfo,
                        discount: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
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
              </div>

              {stayInfo.arrival && stayInfo.departure && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Duration:
                    </span>
                    <span className="font-medium">
                      {calculateNights()} nights
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              {/* Room Price */}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Room Price: (x{calculateNights()})
                </span>
                <span className="font-medium">
                  RM{" "}
                  {(
                    (singleGuest?.payment?.roomPrice || 0) * calculateNights()
                  ).toFixed(2)}
                </span>
              </div>

              {/* Due Amount */}
              <div className="flex justify-between mt-2 pt-2 border-t text-red-500">
                <span className="text-sm font-medium">Previous Due:</span>
                <span className="font-bold">
                  RM {(singleGuest?.payment?.dueAmount || 0).toFixed(2)}
                </span>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between mt-2 pt-2 border-t">
                <span className="text-sm font-medium">New Subtotal:</span>
                <span className="font-bold">
                  RM {calculateTotal().toFixed(2)}
                </span>
              </div>

              {/* Total Paid */}
              <div className="flex justify-between mt-2 pt-2 border-t">
                <span className="text-sm font-medium">Total Paid:</span>
                <span className="font-bold">
                  RM{" "}
                  {(
                    parseFloat(paymentInfo.paidAmount || "0") +
                    (singleGuest?.payment?.paidAmount || 0)
                  ).toFixed(2)}
                </span>
              </div>

              {/* Current Due */}
              <div className="flex justify-between mt-2 pt-2 border-t text-red-500">
                <span className="text-sm font-medium">Current Due:</span>
                <span className="font-bold">
                  RM {calculateDue().toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleNext}
                  disabled={
                    isPending || !stayInfo.departure || !paymentInfo.paidAmount
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div className="grid gap-6 overflow-scroll max-h-80">
            <PaymentInvoice
              bookingInfo={{
                guest: {
                  name: singleGuest?.guest.name,
                  // email: guestInfo.email,
                  phone: singleGuest?.guest?.phone,
                  // country: guestInfo.country,
                  // passport: guestInfo.passport,
                },
                stay: {
                  arrival: singleGuest?.stay?.arrival,
                  departure: singleGuest?.stay?.departure,
                  // adults: stayInfo.adults,
                  // children: stayInfo.children,
                  // nights: calculateNights(),
                },
                room: {
                  number: room.roomNo,
                  type: room.roomType,
                  // floor: room.roomFloor,
                  // price: parseFloat(paymentInfo.roomPrice) || 0,
                },
                payment: {
                  // subtotal:
                  //   (parseFloat(paymentInfo.roomPrice) || 0) *
                  //   calculateNights(),
                  // sst: parseFloat(paymentInfo.sst) || 0,
                  // tourismTax: parseFloat(paymentInfo.tourismTax) || 0,
                  // discount: parseFloat(paymentInfo.discount) || 0,
                  // total: calculateTotal(),
                  paidAmount: parseFloat(paymentInfo?.paidAmount) || 0,
                  // dueAmount: calculateDue(),
                  method: paymentInfo.paymentMethod,
                  remarks: paymentInfo.remarks,
                },
                bookingDate: new Date(),
                paymentId: `PAY-${Date.now()
                  .toString(36)
                  .toUpperCase()}-${Math.random()
                  .toString(36)
                  .substring(2, 10)
                  .toUpperCase()}`,
              }}
              onConfirmBooking={updateGuest}
              isBooking={isPending}
            />

            <div className="flex justify-between gap-2 mt-4">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {/* <Button
                onClick={() => bookRoom()}
                disabled={isPending}
                className="gap-1"
              >
                {isPending ? "Processing..." : "Confirm Booking"}
                {!isPending && <Check className="h-4 w-4" />}
              </Button> */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
