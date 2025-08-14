"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";

const formSchema = z.object({
  // Guest Info
  reservationNo: z.string().min(1, "Plese Enter the Reservation No."),
  name: z.string().min(1, "Plese Enter the guest full name."),
  phone: z.string().min(1, "Please type guest phone number"),
  email: z.string().optional(),
  passport: z.string().optional(),
  ic: z.string().optional(),
  nationality: z.string().optional(),

  // Booking Info
  roomNo: z.string().optional(),
  numOfGuest: z.string().optional(),
  arrivalDate: z.date().optional(),
  departureDate: z.date().optional(),
  roomDetails: z.string().optional(),
  otherGuest: z.string().optional(),

  // Payment Info
  bookingFee: z.number().optional(),
  sst: z.number().optional(),
  tourismTax: z.number().optional(),
  discount: z.number().optional(),
  pricingPolicy: z.string().optional(),
  netPriceInWord: z.string().optional(),
  paymentStatus: z.string().optional(),
});

export default function Reservation() {
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Guest Info
      reservationNo: "",
      name: "",
      phone: "",
      email: "",
      passport: "",
      ic: "",
      nationality: "",

      // Booking Info
      roomNo: "",
      numOfGuest: "",
      arrivalDate: undefined as Date | undefined,
      departureDate: undefined as Date | undefined,
      roomDetails: "",
      otherGuest: "",

      // Payment Info
      bookingFee: undefined,
      sst: undefined,
      tourismTax: undefined,
      discount: undefined,
      pricingPolicy: "",
      netPriceInWord: "",
      paymentStatus: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data, "gekkk");
  };

  const { trigger } = form;
  const handleNext = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];

    if (step === 1) {
      fieldsToValidate = ["reservationNo", "name", "phone"];
    } else if (step === 2) {
      fieldsToValidate = ["arrivalDate", "departureDate"];
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
                {stepNumber === 2 && "Dates"}
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
                        <FormLabel>Reservation No.*</FormLabel>
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
                  {/* Guest Reservation No. */}
                  <FormField
                    control={form.control}
                    name="reservationNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reservation No.*</FormLabel>
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
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" onClick={handleBack} className="gap-1">
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
                  {/* Guest Reservation No. */}
                  <FormField
                    control={form.control}
                    name="reservationNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reservation No.*</FormLabel>
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
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" onClick={handleBack} className="gap-1">
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
              <div className="grid gap-6 overflow-scroll max-h-80">
                {/* <Invoice bookingInfo={} /> */}

                <div className="flex justify-between gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    // onClick={() => bookRoom()}
                    // disabled={isPending}
                    className="gap-1"
                  >
                    {/* {isPending ? "Processing..." : "Confirm Booking"} */}
                    {/* {!isPending && <Check className="h-4 w-4" />} */}
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
