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
import { BedDouble, Calendar } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { IBook } from "@/src/models/book.model";
import { getRoomIcon } from "@/src/utils/getRoomIcon";

export default function StayOver({ room }: { room: IRoom }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({
    departure: "",
    paidAmount: "",
  });

  const { data: singleGuest } = useQuery<IBook>({
    queryKey: ["books", room?.guestId?._id],
    queryFn: () =>
      axios.get(`/api/stayover/${room?.guestId?._id}`).then((res) => res.data),
  });

  const [stayInfo, setStayInfo] = useState({
    arrival: undefined as Date | undefined,
    departure: undefined as Date | undefined,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paidAmount: "",
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
            arrival: stayInfo.arrival || new Date(),
            departure: stayInfo.departure,
          },
          payment: {
            paidAmount:
              (parseFloat(paymentInfo.paidAmount) || 0) +
              (singleGuest?.payment?.paidAmount || 0),
            subtotal: calculateSubTotal(),
            dueAmount: calculateDue(),
          },
        },
      };

      const res = await axios.patch(`/api/stayover/${room?.guestId?._id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Guest Stayed Over successfully!");
      queryClient.invalidateQueries({ queryKey: ["books"] });
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
      calculateTotal() - (parseFloat(paymentInfo.paidAmount) || 0)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1">
          <BedDouble className="h-4 w-4" />
          <span>Stayover</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
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

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
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
                      before: stayInfo.arrival || new Date(),
                    }}
                  />
                </PopoverContent>
              </Popover>
              {formErrors.departure && (
                <p className="text-sm text-red-500">{formErrors.departure}</p>
              )}
            </div>

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
                <p className="text-sm text-red-500">{formErrors.paidAmount}</p>
              )}
            </div>
          </div>

          {stayInfo.arrival && stayInfo.departure && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-medium">{calculateNights()} nights</span>
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
            <span className="font-bold">RM {calculateTotal().toFixed(2)}</span>
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
            <span className="font-bold">RM {calculateDue().toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => updateGuest()}
              className="gap-1"
              disabled={
                isPending || !stayInfo.departure || !paymentInfo.paidAmount
              }
            >
              {isPending ? "Processing..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
