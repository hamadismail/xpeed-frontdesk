"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BedDouble,
  BedSingle,
  Crown,
  Hotel,
  Calendar,
  Clock,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { IRoom, RoomType } from "@/models/room.model";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { GUEST_STATUS, OTAS, PAYMENT_METHOD } from "@/models/book.model";

const getRoomIcon = (type: RoomType) => {
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

export default function ReserveRoom({ room }: { room: IRoom }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Form State
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    passport: "",
    ic: "",
    otas: OTAS.DEFAULT,
    refId: "N/A",
    status: GUEST_STATUS.RESERVED,
  });

  const [stayInfo, setStayInfo] = useState({
    arrival: undefined as Date | undefined,
    departure: undefined as Date | undefined,
    adults: 1,
    children: 1,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    roomPrice: "0",
    sst: "",
    tourismTax: "",
    discount: "",
    paidAmount: "",
    paymentMethod: PAYMENT_METHOD.CASH,
    remarks: "N/A",
  });

  const { mutate: bookRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/reserve", {
        bookingInfo: {
          guest: { ...guestInfo },
          stay: { ...stayInfo },
          payment: {
            ...paymentInfo,
            subtotal: "",
            dueAmount: "",
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
    onError: (error) => {
      toast.error("Booking failed", {
        description: error?.message || "Something went wrong",
      });
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



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1 ">
          <Clock className="h-4 w-4" />
          <span>Reserve</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getRoomIcon(room.roomType)}
            <div>
              <DialogTitle className="text-xl font-bold">
                Reserve Room {room.roomNo}
              </DialogTitle>
              <DialogDescription className="capitalize">
                {room.roomType} • Floor {room.roomFloor}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Guest Name */}
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

            {/* Guest Phone */}
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

            {/* CheckIn */}
            <div className="space-y-2">
              <Label>Arrivale Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !stayInfo.arrival && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {stayInfo.arrival ? (
                      format(stayInfo.arrival, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-h-[280px] overflow-auto">
                  <DatePicker
                    mode="single"
                    selected={stayInfo.arrival}
                    onSelect={(date) =>
                      setStayInfo({ ...stayInfo, arrival: date })
                    }

                    // captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Checked Out */}
            <div className="space-y-2">
              <Label>Departure Date *</Label>
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
                    onSelect={(date) =>
                      setStayInfo({ ...stayInfo, departure: date })
                    }
                    disabled={{
                      before: stayInfo.arrival || new Date(),
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Deposit</Label>
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
          </div>

          {stayInfo.arrival && stayInfo.departure && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-medium">{calculateNights()} nights</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => bookRoom()} disabled={isPending} className="gap-1">
              {isPending ? "Processing..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
