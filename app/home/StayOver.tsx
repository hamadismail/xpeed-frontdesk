"use client";

import { useEffect, useState } from "react";
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
import { BedDouble, BedSingle, Crown, Hotel, Calendar } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { IBook } from "@/models/book.model";

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

export default function StayOver({ room }: { room: IRoom }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: singleGuest } = useQuery<IBook>({
    queryKey: ["books"],
    queryFn: () =>
      axios.get(`/api/stayover/${room?.guestId}`).then((res) => res.data),
  });

  const [stayInfo, setStayInfo] = useState({
    arrival: undefined as Date | undefined,
    departure: undefined as Date | undefined,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paidAmount: "",
  });

  const { mutate: updateGuest, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.patch(`/api/stayover/${room?.guestId}`, {
        bookingInfo: {
          stay: { ...stayInfo },
          payment: {
            ...paymentInfo,
            subtotal: calculateTotal() + parseFloat(paymentInfo.paidAmount),
            dueAmount: calculateDue(),
          },
        },
      });
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
        stayInfo?.departure?.getTime() - stayInfo.arrival.getTime()
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

  const calculateDue = () => {
    return calculateTotal() - parseFloat(paymentInfo.paidAmount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1 ">
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
              RM {(singleGuest?.payment?.roomPrice || 0) * calculateNights()}
            </span>
          </div>

          {/* Due Amount */}
          <div className="flex justify-between mt-2 pt-2 border-t text-red-500">
            <span className="text-sm font-medium">Previous Due:</span>
            <span className="font-bold">
              RM {singleGuest?.payment?.dueAmount || "N/A"}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between mt-2 pt-2 border-t">
            <span className="text-sm font-medium">New Subtotal:</span>
            <span className="font-bold">RM {calculateTotal()}</span>
          </div>

          {/* Total Paid */}
          <div className="flex justify-between mt-2 pt-2 border-t">
            <span className="text-sm font-medium">Total Paid:</span>
            <span className="font-bold">RM {paymentInfo.paidAmount || 0}</span>
          </div>

          {/* Current Due */}
          <div className="flex justify-between mt-2 pt-2 border-t text-red-500">
            <span className="text-sm font-medium">Current Due:</span>
            <span className="font-bold">
              RM {calculateDue() || calculateTotal()}
            </span>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => updateGuest()} className="gap-1">
              {isPending ? "Process..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
