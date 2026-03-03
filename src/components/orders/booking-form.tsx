"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Sparkles, Loader2, Package, MapPin, Calendar, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { aiBookingAssistant } from "@/ai/flows/ai-booking-assistant-flow"

const bookingSchema = z.object({
  pickupAddress: z.string().min(10, "Address is too short"),
  deliveryAddress: z.string().min(10, "Address is too short"),
  itemDescription: z.string().min(5, "Please describe the items"),
  packageType: z.string().optional(),
  estimatedWeight: z.string().optional(),
  deliveryWindow: z.string().optional(),
})

export function BookingForm() {
  const [isAiLoading, setIsAiLoading] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickupAddress: "",
      deliveryAddress: "",
      itemDescription: "",
      packageType: "",
      estimatedWeight: "",
      deliveryWindow: "",
    },
  })

  async function handleAiAssistant() {
    const values = form.getValues()
    if (!values.pickupAddress || !values.deliveryAddress || !values.itemDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in addresses and item description first.",
        variant: "destructive",
      })
      return
    }

    setIsAiLoading(true)
    try {
      const result = await aiBookingAssistant({
        pickupAddress: values.pickupAddress,
        deliveryAddress: values.deliveryAddress,
        itemDescription: values.itemDescription,
      })

      form.setValue("packageType", result.packageType)
      form.setValue("estimatedWeight", result.estimatedWeightKg.toString())
      form.setValue("deliveryWindow", result.recommendedDeliveryWindow)

      toast({
        title: "AI Suggestions Applied",
        description: "Package type, weight, and delivery window have been updated.",
      })
    } catch (error) {
      toast({
        title: "AI Helper Unavailable",
        description: "Could not generate suggestions at this time.",
        variant: "destructive",
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  function onSubmit(values: z.infer<typeof bookingSchema>) {
    toast({
      title: "Booking Created",
      description: "The delivery order has been successfully logged.",
    })
    form.reset()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create Delivery Booking</CardTitle>
            <CardDescription>Enter shipment details below. Use the AI assistant for faster entry.</CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/5"
            onClick={handleAiAssistant}
            disabled={isAiLoading}
          >
            {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI Assist
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-primary mb-2">
                  <MapPin className="h-4 w-4" /> Route Details
                </div>
                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full pickup location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter destination address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-primary mb-2">
                  <Package className="h-4 w-4" /> Item Details
                </div>
                <FormField
                  control={form.control}
                  name="itemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What are you shipping?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe items (e.g. 2 boxes of electronics)" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border">
              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Medium Box" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 5.5" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Window</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2-3 Days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => form.reset()}>Cancel</Button>
              <Button type="submit" size="lg" className="px-8">Create Booking</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}