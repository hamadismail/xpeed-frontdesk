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
import {
  CalendarCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { GUEST_STATUS, OTAS, PAYMENT_METHOD } from "@/src/models/book.model";
import { getRoomIcon } from "@/src/utils/getRoomIcon";
import { PaymentInvoice } from "../../layout/PaymentInvoice";

export default function BookRoomDialog({ room }: { room: IRoom }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    passport: "",
    ic: "",
    otas: OTAS.DEFAULT,
    refId: "",
    status: GUEST_STATUS.CHECKED_IN,
  });

  const [stayInfo, setStayInfo] = useState({
    arrival: undefined as Date | undefined,
    departure: undefined as Date | undefined,
    adults: 1,
    children: 1,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    roomPrice: "",
    sst: "",
    tourismTax: "",
    discount: "",
    paidAmount: "",
    paymentMethod: PAYMENT_METHOD.CASH,
    remarks: "",
  });

  const { mutate: bookRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/book", {
        bookingInfo: {
          guest: { ...guestInfo },
          stay: { ...stayInfo },
          payment: {
            ...paymentInfo,
            subtotal: calculateTotal(),
            dueAmount: calculateDue(),
          },
          roomId: room?._id,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Room booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      resetForm();
      setOpen(false);
    },
    onError: (error: unknown) => {
      // Check if it's a conflict error (409) from our validation
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("Booking failed", {
          description:
            error.response.data?.message ||
            "Room not available for selected dates",
        });
      } else if (axios.isAxiosError(error)) {
        toast.error("Booking failed", {
          description: error.message || "Something went wrong",
        });
      } else {
        toast.error("Booking failed", {
          description: "Something went wrong",
        });
      }
    },
  });

  const resetForm = () => {
    setGuestInfo({
      name: "",
      email: "",
      phone: "",
      country: "",
      passport: "",
      ic: "",
      otas: OTAS.DEFAULT,
      refId: "",
      status: GUEST_STATUS.CHECKED_IN,
    });
    setStayInfo({
      arrival: undefined,
      departure: undefined,
      adults: 1,
      children: 0,
    });
    setPaymentInfo({
      roomPrice: "",
      sst: "",
      tourismTax: "",
      discount: "",
      paidAmount: "",
      paymentMethod: PAYMENT_METHOD.CASH,
      remarks: "",
    });
    setStep(1);
  };

  const handleNext = () => {
    if (
      step === 1 &&
      (!guestInfo.name || !guestInfo.phone || !guestInfo.refId)
    ) {
      toast.warning("Please fill in required guest information");
      return;
    }
    if (
      step === 2 &&
      (!stayInfo.arrival || !stayInfo.departure || !stayInfo.adults)
    ) {
      toast.warning("Please select arrival and departure dates");
      return;
    }
    if (
      step === 3 &&
      (!paymentInfo.roomPrice ||
        !paymentInfo.paidAmount ||
        !paymentInfo.remarks)
    ) {
      toast.warning("Please enter required field");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

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
    let nights = calculateNights();
    const roomPrice = parseFloat(paymentInfo.roomPrice) || 0;
    const sst = parseFloat(paymentInfo.sst) || 0;
    const tourismTax = parseFloat(paymentInfo.tourismTax) || 0;
    const discount = parseFloat(paymentInfo.discount) || 0;

    if (nights < 1) {
      nights = 1;
    }

    // Calculate SST as percentage of room price
    const sstAmount = (roomPrice * nights * sst) / 100;
    // Calculate tourism tax per night
    const tourismTaxAmount = tourismTax * nights;

    return roomPrice * nights + sstAmount + tourismTaxAmount - discount;
  };

  const calculateDue = () => {
    return calculateTotal() - parseFloat(paymentInfo.paidAmount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="h-8 px-3 gap-1 ">
          <CalendarCheck className="h-4 w-4" />
          <span>Checkin</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl min-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getRoomIcon(room.roomType)}
            <div>
              <DialogTitle className="text-xl font-bold">
                Book Room {room.roomNo}
              </DialogTitle>
              <DialogDescription className="capitalize">
                {room.roomType} • Floor {room.roomFloor}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex justify-center gap-8 md:gap-16 mb-6">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  step === stepNumber
                    ? "bg-primary text-primary-foreground"
                    : step > stepNumber
                    ? "bg-green-100 text-green-800"
                    : "bg-muted",
                  step > stepNumber && "border-2 border-green-500"
                )}
              >
                {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">
                {stepNumber === 1 && "Guest"}
                {stepNumber === 2 && "Dates"}
                {stepNumber === 3 && "Payment"}
                {stepNumber === 4 && "Confirm"}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Guest Information */}
        {step === 1 && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={guestInfo.name}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={guestInfo.phone}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, phone: e.target.value })
                  }
                  placeholder="+60123456789"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={guestInfo.email}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={guestInfo.country}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, country: e.target.value })
                  }
                  placeholder="Malaysia"
                />
              </div>
              <div className="space-y-2">
                <Label>Passport/IC</Label>
                <Input
                  value={guestInfo.passport}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, passport: e.target.value })
                  }
                  placeholder="A12345678"
                />
              </div>
              <div className="space-y-2">
                <Label>Reference Id *</Label>
                <Input
                  value={guestInfo.refId}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, refId: e.target.value })
                  }
                  placeholder="Type Reference Id"
                />
              </div>

              <div className="space-y-2">
                <Label>OTA/Reference</Label>
                <Select
                  value={guestInfo.otas}
                  onValueChange={(value) =>
                    setGuestInfo({ ...guestInfo, otas: value as OTAS })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select OTA/Reference" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OTAS).map((ota) => (
                      <SelectItem key={ota} value={ota}>
                        {ota}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleNext} className="gap-1">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Stay Information */}
        {step === 2 && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              {/* stay date */}
              <div className="space-y-2">
                <Label>Stay Dates *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !stayInfo.arrival &&
                          !stayInfo.departure &&
                          "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {stayInfo.arrival && stayInfo.departure ? (
                        `${format(stayInfo.arrival, "MMM dd")} - ${format(
                          stayInfo.departure,
                          "MMM dd, yyyy"
                        )}`
                      ) : stayInfo.arrival ? (
                        `${format(stayInfo.arrival, "PPP")} - Select departure`
                      ) : (
                        <span>Select arrival and departure dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="center"
                    side="right"
                  >
                    <DatePicker
                      mode="range"
                      selected={{
                        from: stayInfo.arrival,
                        to: stayInfo.departure,
                      }}
                      onSelect={(range) => {
                        if (range?.from) {
                          setStayInfo({
                            ...stayInfo,
                            arrival: range.from,
                            departure: range.to,
                          });
                        }
                      }}
                      disabled={{
                        before: new Date(new Date().setHours(0, 0, 0, 0)),
                      }}
                      numberOfMonths={2}
                      defaultMonth={stayInfo.arrival || new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Adults</Label>
                <Input
                  type="number"
                  min="1"
                  value={stayInfo.adults}
                  onChange={(e) =>
                    setStayInfo({
                      ...stayInfo,
                      adults: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Children</Label>
                <Input
                  type="number"
                  // min="0"
                  value={stayInfo.children}
                  onChange={(e) =>
                    setStayInfo({
                      ...stayInfo,
                      children: parseInt(e.target.value) || 0,
                    })
                  }
                />
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

            <div className="flex justify-between gap-2 mt-4">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} className="gap-1">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Information */}
        {step === 3 && (
          <div className="grid gap-4 overflow-scroll max-h-[350px]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Price *</Label>
                <Input
                  type="number"
                  value={paymentInfo.roomPrice}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      roomPrice: e.target.value,
                    })
                  }
                  placeholder="200.00"
                />
              </div>

              <div className="space-y-2">
                <Label>SST (%)</Label>
                <Input
                  type="number"
                  value={paymentInfo.sst}
                  onChange={(e) =>
                    setPaymentInfo({ ...paymentInfo, sst: e.target.value })
                  }
                  placeholder="6"
                />
              </div>

              <div className="space-y-2">
                <Label>Tourism Tax (per night)</Label>
                <Input
                  type="number"
                  value={paymentInfo.tourismTax}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      tourismTax: e.target.value,
                    })
                  }
                  placeholder="10.00"
                />
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  value={paymentInfo.discount}
                  onChange={(e) =>
                    setPaymentInfo({ ...paymentInfo, discount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Paid Amount *</Label>
                <Input
                  type="number"
                  value={paymentInfo.paidAmount}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      paidAmount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Remarks *</Label>
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

              {/* <div className="space-y-2">
                <Label>Due Amount</Label>
                <Input type="number" readOnly value= />
                <h5 className="p-2">{calculateDue() || 0}</h5>
              </div> */}

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

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Room Price ({calculateNights()} nights):
                </span>
                <span className="font-medium">
                  RM{" "}
                  {(parseFloat(paymentInfo.roomPrice) || 0) * calculateNights()}
                </span>
              </div>
              {paymentInfo.sst && parseFloat(paymentInfo.sst) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    SST ({paymentInfo.sst}%):
                  </span>
                  <span className="font-medium">
                    RM{" "}
                    {(
                      ((parseFloat(paymentInfo.roomPrice) || 0) *
                        calculateNights() *
                        parseFloat(paymentInfo.sst)) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              {paymentInfo.tourismTax &&
                parseFloat(paymentInfo.tourismTax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tourism Tax ({calculateNights()} nights):
                    </span>
                    <span className="font-medium">
                      RM{" "}
                      {(
                        (parseFloat(paymentInfo.tourismTax) || 0) *
                        calculateNights()
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              {paymentInfo.discount && parseFloat(paymentInfo.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Discount:
                  </span>
                  <span className="font-medium text-red-500">
                    - RM {parseFloat(paymentInfo.discount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between mt-2 pt-2 border-t">
                <span className="text-sm font-medium">Total Amount:</span>
                <span className="font-bold">
                  RM {calculateTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t">
                <span className="text-sm font-medium">Total Paid:</span>
                <span className="font-bold">
                  RM {parseFloat(paymentInfo.paidAmount || "0").toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t text-red-500">
                <span className="text-sm font-medium">Due Amount:</span>
                <span className="font-bold">
                  RM {calculateDue().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-between gap-2 mt-4">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} className="gap-1">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="grid gap-6 overflow-scroll max-h-80">
            <PaymentInvoice
              bookingInfo={{
                guest: {
                  name: guestInfo.name,
                  // email: guestInfo.email,
                  phone: guestInfo.phone,
                  // country: guestInfo.country,
                  // passport: guestInfo.passport,
                },
                stay: {
                  arrival: stayInfo.arrival!,
                  departure: stayInfo.departure!,
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
                  paidAmount: parseFloat(paymentInfo.paidAmount) || 0,
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
              onConfirmBooking={bookRoom}
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
