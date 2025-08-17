"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/src/components/ui/calendar";
import { Textarea } from "@/src/components/ui/textarea";
import ReservationInvoive from "@/src/components/layout/ReservationInvoive";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { IRoom, RoomStatus } from "@/src/models/room.model";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/src/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { OTAS } from "@/src/models/book.model";
import { IReservation } from "@/src/types";

const formSchema = z.object({
  // Guest Info
  reservationNo: z.string().optional(),
  ota: z.string().optional(),
  name: z.string().min(1, "Plese Enter the guest full name."),
  phone: z.string().min(1, "Please type guest phone number"),
  email: z.string().optional(),
  passport: z.string().optional(),
  ic: z.string().optional(),
  nationality: z.string().optional(),

  // Booking Info
  roomNo: z.string().min(1, "Room no. is required"),
  numOfGuest: z.string().optional(),
  arrivalDate: z.date().min(new Date(), "Arrival date is required"),
  departureDate: z.date().min(new Date(), "Departure date is required"),
  roomDetails: z.string().optional(),
  otherGuest: z.string().optional(),

  // Payment Info
  bookingFee: z.string().min(1, "Booking fee is required"),
  sst: z.string().optional(),
  tourismTax: z.string().optional(),
  discount: z.string().optional(),
  pricingPolicy: z.string().optional(),
  netPriceInWord: z.string().optional(),
  paymentStatus: z.string().optional(),
});

const fetchRooms = async (query: string) => {
  const res = await axios.get(`/api/rooms`, {
    params: { search: query }, // automatically builds ?search=value
  });
  return res.data;
};

const fetchReservedGuests = async (reserveQuery: string) => {
  const res = await axios.get(`/api/reserve`, {
    params: { search: reserveQuery }, // automatically builds ?search=value
  });
  return res.data;
};

export default function Reservation() {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [reserveQuery, setReserveQuery] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery<IRoom[]>({
    queryKey: ["rooms", query],
    queryFn: () => fetchRooms(query),
    enabled: query.length > 0, // only fetch if query is not empty
    initialData: [],
  });

  const { data: reservedGuests, isLoading: reservedLoading } = useQuery<
    IReservation[]
  >({
    queryKey: ["reserve", reserveQuery],
    queryFn: () => fetchReservedGuests(reserveQuery),
    enabled: reserveQuery.length > 0, // only fetch if query is not empty
    initialData: [],
  });

  const allAvailableRooms = rooms.filter(
    (room) =>
      room.roomStatus === RoomStatus.AVAILABLE ||
      room.roomStatus === RoomStatus.RESERVED
  );
  const availableRooms = allAvailableRooms.slice(0, 6);

  const reserveArrival = reservedGuests[0]?.room?.arrival;
  const reserveDeparture = reservedGuests[0]?.room?.departure;

  const { mutate: reserveRoom, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        guest: {
          reservationNo: data.reservationNo,
          ota: data.ota,
          name: data.name,
          email: data.email,
          phone: data.phone,
          nationality: data.nationality,
          passport: data.passport,
        },
        room: {
          roomNo: data.roomNo,
          numOfGuest: data.numOfGuest,
          arrival: data.arrivalDate,
          departure: data.departureDate,
          roomDetails: data.roomDetails,
          otherGuest: data.otherGuest,
        },
        payment: {
          bookingFee: data.bookingFee,
          sst: data.sst,
          tourismTax: data.tourismTax,
          fnfDiscount: data.discount,
          pricingPolicy: data.pricingPolicy,
          netPriceInWord: data.netPriceInWord,
          paymentStatus: data.paymentStatus,
        },
        reservationDate: new Date().toISOString(),
      };
      const res = await axios.post("/api/reserve", { payload });

      if (res?.data?.success) {
        toast.success("Room reserved successfully!");
        queryClient.invalidateQueries({ queryKey: ["reserve"] });
      } else {
        toast.error("Booking failed", {
          description: res?.data?.error || "Something went wrong",
        });
      }
    },
    // onSuccess: () => {
    //   toast.success("Room reserved successfully!");
    //   queryClient.invalidateQueries({ queryKey: ["reserve"] });
    // },
    // onError: (error) => {
    //   toast.error("Booking failed", {
    //     description: error?.message || "Something went wrong",
    //   });
    // },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Guest Info
      reservationNo: "",
      ota: "",
      name: "",
      phone: "",
      email: "",
      passport: "",
      ic: "",
      nationality: "",

      // Booking Info
      roomNo: "",
      numOfGuest: "",
      arrivalDate: reserveDeparture,
      departureDate: reserveDeparture,
      roomDetails: "",
      otherGuest: "",

      // Payment Info
      bookingFee: "",
      sst: "",
      tourismTax: "",
      discount: "",
      pricingPolicy: "",
      netPriceInWord: "",
      paymentStatus: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    reserveRoom(data);
  };

  const { trigger } = form;
  const handleNext = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];

    if (step === 1) {
      fieldsToValidate = ["name", "phone"];
    } else if (step === 2) {
      fieldsToValidate = ["roomNo", "arrivalDate", "departureDate"];
    } else if (step === 3) {
      fieldsToValidate = ["bookingFee"];
    }

    // Trigger Zod validation for the current step
    const isStepValid = await trigger(fieldsToValidate);

    if (!isStepValid) {
      toast.error("Missing Required Fiels");
      return;
    } // Stop if validation failed

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div>
      <div className="w-full max-w-4xl px-4 mx-auto">
        <div className="text-center text-xl font-bold mt-4 mb-8">
          Reserbe The Room
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 w-1/2 mx-auto">
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
                {stepNumber === 2 && "Room"}
                {stepNumber === 3 && "Payment"}
                {stepNumber === 4 && "Confirm"}
              </span>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Guest Information */}
            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Guest Reservation No. */}
                  <FormField
                    control={form.control}
                    name="reservationNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reservation No.</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type guest reservation no."
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* OTAs */}
                  <FormField
                    control={form.control}
                    name="ota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTA</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Guest Full Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type guest full name"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Guest Full Name */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone*</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type guest phone number"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Guest Email  */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type guest phone number"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Guest Passport  */}
                  <FormField
                    control={form.control}
                    name="passport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IC/Passport</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type guest phone number"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Guest Nationality  */}
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type guest phone number"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" onClick={handleNext} className="gap-1">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Booking Information */}
            {step === 2 && (
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Room No. */}
                  <FormField
                    control={form.control}
                    name="roomNo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Room No.</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? availableRooms?.find(
                                      (room) => room.roomNo === field.value
                                    )?.roomNo || field.value
                                  : "Select room"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[250px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search room..."
                                value={query}
                                onValueChange={(val) => {
                                  setQuery(val);
                                  setReserveQuery(val);
                                }}
                              />
                              <CommandEmpty>
                                {isLoading ? "Loading..." : "No room found"}
                              </CommandEmpty>
                              <CommandGroup>
                                {availableRooms?.map((room) => (
                                  <CommandItem
                                    value={room.roomNo}
                                    key={room._id?.toString()}
                                    onSelect={() => {
                                      form.setValue("roomNo", room.roomNo);
                                      setOpen(false);
                                      setQuery("");
                                      // setReserveQuery("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        room.roomNo === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {room.roomNo} - {room.roomType}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Number of Guests. */}
                  <FormField
                    control={form.control}
                    name="numOfGuest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Guests</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type number of guests."
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Arrival Date */}
                  <FormField
                    control={form.control}
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Arrivale Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto max-h-[280px] overflow-y-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              // captionLayout="dropdown"
                              disabled={[
                                {
                                  before: new Date(),
                                },
                                {
                                  from: reserveArrival,
                                  to: reserveDeparture,
                                },
                              ]}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="sr-only">
                          Your date is used.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Departure Date */}
                  <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Departure Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 max-h-[280px] overflow-y-auto"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              // captionLayout="dropdown"
                              disabled={{
                                before: form.watch("arrivalDate") || new Date(),
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="sr-only">
                          Your date is used.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room Details */}
                  <FormField
                    control={form.control}
                    name="roomDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Your room details"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="sr-only">
                          You can <span>@mention</span> other users and
                          organizations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Other Guests */}
                  <FormField
                    control={form.control}
                    name="otherGuest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Guests</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Your guests info"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="sr-only">
                          You can <span>@mention</span> other users and
                          organizations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="gap-1">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Information */}
            {step === 3 && (
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Booking Fee */}
                  <FormField
                    control={form.control}
                    name="bookingFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Fees</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Type booking fee."
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SST */}
                  <FormField
                    control={form.control}
                    name="sst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SST (8%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Type sst fee."
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tourism Tax */}
                  <FormField
                    control={form.control}
                    name="tourismTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tourism Tax</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Type tourism tax"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* FnF Discount */}
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FnF Discount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter discount amount"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Net Price in Words */}
                  <FormField
                    control={form.control}
                    name="netPriceInWord"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Price In Words</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter net price in word"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Status */}
                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type Payment Status"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Status */}
                  <FormField
                    control={form.control}
                    name="pricingPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing Policy</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type Pricing Policy"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="gap-1">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="grid gap-6 overflow-auto max-h-80">
                <ReservationInvoive
                  bookingInfo={{
                    guest: {
                      reservationNo: form.getValues("reservationNo") ?? "",
                      ota: form.getValues("ota") ?? "",
                      name: form.getValues("name"),
                      email: form.getValues("email"),
                      phone: form.getValues("phone"),
                      nationality: form.getValues("nationality"),
                      passport: form.getValues("passport"),
                    },
                    room: {
                      roomNo: form.getValues("roomNo"),
                      numOfGuest: form.getValues("numOfGuest"),
                      arrival: form.getValues("arrivalDate") || new Date(),
                      departure: form.getValues("departureDate") || new Date(),
                      roomDetails: form.getValues("roomDetails"),
                      otherGuest: form.getValues("otherGuest"),
                    },
                    payment: {
                      bookingFee: parseFloat(
                        form.getValues("bookingFee") || "0"
                      ),
                      sst: parseFloat(form.getValues("sst") || "0"),
                      tourismTax: parseFloat(
                        form.getValues("tourismTax") || "0"
                      ),
                      fnfDiscount: parseFloat(
                        form.getValues("discount") || "0"
                      ),
                      totalAmount:
                        parseFloat(form.getValues("bookingFee") || "0") +
                        parseFloat(form.getValues("sst") || "0") +
                        parseFloat(form.getValues("tourismTax") || "0") -
                        parseFloat(form.getValues("discount") || "0"),
                    },
                    reservationDate: new Date().toLocaleString(),
                  }}
                  onConfirmBooking={form.handleSubmit(onSubmit)}
                  onBack={handleBack}
                  isPending={isPending}
                />
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
