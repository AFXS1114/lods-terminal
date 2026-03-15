"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { Sparkles, Loader2, Package, MapPin, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { aiBookingAssistant } from "@/lib/gemini"

const bookingSchema = z.object({
  pickupAddress: z.string().min(5, "Address is too short"),
  deliveryAddress: z.string().min(5, "Address is too short"),
  itemDescription: z.string().min(3, "Please describe the items"),
  merchantId: z.string().min(1, "Please select a merchant"),
  packageType: z.string().optional(),
  estimatedWeight: z.string().optional(),
  deliveryWindow: z.string().optional(),
  customerName: z.string().min(2, "Customer name required"),
  finalTotal: z.string().default("15.00"),
})

export function BookingForm() {
  const [isAiLoading, setIsAiLoading] = useState(false)
  const firestore = useFirestore()
  const { toast } = useToast()

  const merchantsQuery = useMemoFirebase(() => {
    return query(collection(firestore, "merchants"), orderBy("name", "asc"))
  }, [firestore])

  const { data: merchants, isLoading: loadingMerchants } = useCollection(merchantsQuery)
  
  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickupAddress: "",
      deliveryAddress: "",
      itemDescription: "",
      merchantId: "",
      packageType: "",
      estimatedWeight: "",
      deliveryWindow: "",
      customerName: "",
      finalTotal: "15.00",
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

  async function onSubmit(values: z.infer<typeof bookingSchema>) {
    const selectedMerchant = merchants?.find(m => m.id === values.merchantId)
    
    addDocumentNonBlocking(collection(firestore, "orders"), {
      bookingNo: `LODS-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: values.customerName,
      merchant: selectedMerchant?.name || "Unknown Merchant",
      merchantId: values.merchantId,
      status: "pending",
      finalTotal: parseFloat(values.finalTotal),
      createdAt: new Date().toISOString(), // Using ISO string as per existing backend.json schema for format: date-time
      deliveryLocation: {
        address: values.deliveryAddress,
        lat: 6.5244,
        lng: 3.3792
      },
      pickupLocation: {
        address: values.pickupAddress
      },
      itemDetails: {
        description: values.itemDescription,
        packageType: values.packageType,
        weight: values.estimatedWeight,
        window: values.deliveryWindow
      }
    })

    toast({
      title: "Booking Created",
      description: "The delivery order has been successfully logged.",
    })
    form.reset()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md border-none overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create Delivery Booking</CardTitle>
            <CardDescription>Enter shipment details below or use AI to auto-fill metrics.</CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/5 h-9"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border bg-muted/5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest mb-2">
                  <MapPin className="h-4 w-4" /> Route Intelligence
                </div>
                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full pickup location" {...field} className="bg-background" />
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
                        <Input placeholder="Enter destination address" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest mb-2">
                  <Store className="h-4 w-4" /> Partner Details
                </div>
                <FormField
                  control={form.control}
                  name="merchantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Merchant</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={loadingMerchants ? "Loading partners..." : "Choose a merchant"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {merchants?.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                          {(!merchants || merchants.length === 0) && !loadingMerchants && (
                            <div className="p-2 text-xs text-center text-muted-foreground">No merchants found. Add one in Partners Registry.</div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Recipient name" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest">
                <Package className="h-4 w-4" /> Shipment Specifications
              </div>
              <FormField
                control={form.control}
                name="itemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Item description (e.g. 2 Hot Pizzas, 1 Cold Drink)" className="min-h-[80px] bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Package Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Medium Box" {...field} className="bg-background h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Weight (kg)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1.2" {...field} className="bg-background h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Window</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Same Day" {...field} className="bg-background h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finalTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Fee ($)</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} className="bg-background h-8 font-bold text-primary" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="ghost" onClick={() => form.reset()}>Discard</Button>
              <Button type="submit" size="lg" className="px-10 shadow-lg shadow-primary/20">
                Confirm Booking
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
