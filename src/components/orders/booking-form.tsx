"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import * as z from "zod"
import { collection, query, orderBy, where, serverTimestamp } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { Sparkles, Loader2, Package, MapPin, Store, User, ShoppingCart, Plus, Trash2, Banknote, Truck, Navigation, Search } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const itemSchema = z.object({
  name: z.string().min(1, "Item name required"),
  qty: z.coerce.number().min(1, "Min 1"),
  price: z.coerce.number().min(0, "Min 0"),
})

const pabiliSchema = z.object({
  customerName: z.string().min(2, "Customer name required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  merchantId: z.string().min(1, "Please select a merchant"),
  deliveryAddress: z.string().min(5, "Delivery address required"),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  riderId: z.string().min(1, "Please assign a rider"),
  deliveryFee: z.coerce.number().default(49),
})

export function BookingForm() {
  const firestore = useFirestore()
  const { toast } = useToast()

  // Queries
  const merchantsQuery = useMemoFirebase(() => {
    return query(collection(firestore, "merchants"), where("status", "==", "active"), orderBy("name", "asc"))
  }, [firestore])

  const ridersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), where("role", "==", "rider"), where("status", "==", "online"))
  }, [firestore])

  const ratesQuery = useMemoFirebase(() => {
    return query(collection(firestore, "deliveryRates"), orderBy("LOCATION", "asc"))
  }, [firestore])

  const { data: merchants, isLoading: loadingMerchants } = useCollection(merchantsQuery)
  const { data: riders, isLoading: loadingRiders } = useCollection(ridersQuery)
  const { data: rates } = useCollection(ratesQuery)

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const form = useForm<z.infer<typeof pabiliSchema>>({
    resolver: zodResolver(pabiliSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      merchantId: "",
      deliveryAddress: "",
      items: [{ name: "", qty: 1, price: 0 }],
      riderId: "",
      deliveryFee: 49,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Watch items for real-time calculations
  const itemsWatch = useWatch({
    control: form.control,
    name: "items",
  })
  const deliveryFeeWatch = useWatch({
    control: form.control,
    name: "deliveryFee",
  })
  const deliveryAddressWatch = useWatch({
    control: form.control,
    name: "deliveryAddress"
  })

  useEffect(() => {
    if (deliveryAddressWatch && rates) {
      const filtered = rates.filter(rate => 
        rate.LOCATION?.toLowerCase().includes(deliveryAddressWatch.toLowerCase())
      ).slice(0, 5)
      setAddressSuggestions(filtered)
    } else {
      setAddressSuggestions([])
    }
  }, [deliveryAddressWatch, rates])

  const calculateSubtotal = () => {
    return itemsWatch.reduce((acc, item) => acc + (item.qty * item.price), 0)
  }

  const subtotal = calculateSubtotal()
  const grandTotal = subtotal + Number(deliveryFeeWatch)

  const handleSelectSuggestion = (rate: any) => {
    form.setValue("deliveryAddress", rate.LOCATION)
    form.setValue("deliveryFee", Number(rate["DELIVERY FEE"]))
    setShowSuggestions(false)
    toast({
      title: "Rate Synchronized",
      description: `Delivery fee for ${rate.LOCATION} set to ₱${rate["DELIVERY FEE"]}.`,
    })
  }

  async function onSubmit(values: z.infer<typeof pabiliSchema>) {
    const selectedMerchant = merchants?.find(m => m.id === values.merchantId)
    const selectedRider = riders?.find(r => r.id === values.riderId)

    addDocumentNonBlocking(collection(firestore, "orders"), {
      bookingNo: `PABILI-${Math.floor(10000 + Math.random() * 90000)}`,
      serviceType: "pabili",
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone,
      merchantId: values.merchantId,
      merchantName: selectedMerchant?.name || "Generic Merchant",
      deliveryAddress: values.deliveryAddress,
      items: values.items.map(item => ({
        ...item,
        total: item.qty * item.price
      })),
      riderId: values.riderId,
      riderName: selectedRider?.name || "Assigned Rider",
      status: "assigned",
      subtotal: subtotal,
      deliveryFee: Number(values.deliveryFee),
      finalTotal: grandTotal,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    toast({
      title: "Pabili Order Deployed",
      description: `Order successfully assigned to ${selectedRider?.name || 'rider'}.`,
    })
    form.reset()
  }

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-xl border-none overflow-hidden bg-background/50 backdrop-blur-sm">
      <CardHeader className="border-b bg-primary/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
              <ShoppingCart className="h-6 w-6" /> Pabili (Buy Me) Service
            </CardTitle>
            <CardDescription>Initialize a new localized purchase and delivery request.</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary uppercase tracking-tighter font-bold px-3">
            Terminal Engine v2.0
          </Badge>
        </div>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-0">
          <CardContent className="p-6 space-y-8">
            {/* 1st Div: Customer Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                <User className="h-4 w-4 text-primary" /> Customer Intelligence
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-muted/20 border-primary/5">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact No.</FormLabel>
                      <FormControl>
                        <Input placeholder="09XX-XXX-XXXX" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 2nd Div: Delivery Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Logistics Parameters
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20 border-primary/5">
                <FormField
                  control={form.control}
                  name="merchantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Merchant</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={loadingMerchants ? "Fetching partners..." : "Select Merchant"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {merchants?.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name} ({m.category})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Ship To Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Full street address, landmark" 
                            {...field} 
                            className="bg-background" 
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            autoComplete="off"
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                        </div>
                      </FormControl>
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          {addressSuggestions.map((rate) => (
                            <div 
                              key={rate.id} 
                              className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between border-b last:border-b-0 group transition-colors"
                              onMouseDown={() => handleSelectSuggestion(rate)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  <Navigation className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{rate.LOCATION}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Regional Rate Intelligence</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 font-bold text-primary group-hover:scale-110 transition-transform">
                                <span className="text-xs">₱</span>
                                {rate["DELIVERY FEE"]}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 3rd Div: Order Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                  <Package className="h-4 w-4 text-primary" /> Order Manifest
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ name: "", qty: 1, price: 0 })}
                  className="h-7 text-[10px] font-bold uppercase border-primary/20 hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-3 p-4 rounded-xl border bg-primary/5 border-primary/10">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-end group">
                    <div className="col-span-12 md:col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase text-muted-foreground">Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Item description" {...field} className="bg-background h-9" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.qty`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase text-muted-foreground">Qty</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="bg-background h-9" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-5 md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase text-muted-foreground">Price (₱)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} className="bg-background h-9 font-mono" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2 flex items-center gap-2 h-9">
                      <div className="flex-1 text-right font-bold text-xs text-primary bg-background h-full flex items-center justify-end px-2 rounded border border-primary/5">
                        ₱{(itemsWatch[index]?.qty * itemsWatch[index]?.price || 0).toFixed(2)}
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator className="my-4 bg-primary/10" />

                <div className="flex flex-col items-end space-y-2">
                   <div className="flex items-center gap-10 text-sm">
                      <span className="text-muted-foreground">Items Subtotal:</span>
                      <span className="font-bold">₱{subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center gap-4 text-sm w-48">
                      <FormField
                        control={form.control}
                        name="deliveryFee"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0 w-full">
                            <FormLabel className="text-muted-foreground text-sm whitespace-nowrap">Delivery Fee:</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="bg-background h-8 font-mono text-right font-bold" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                   </div>
                   <div className="flex items-center gap-10 text-xl font-bold text-primary pt-2">
                      <span>Total Cost:</span>
                      <span>₱{grandTotal.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* 4th Div: Rider Assignment */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" /> Fleet Orchestration
              </div>
              <div className="p-4 rounded-xl border bg-accent/5 border-accent/20 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full">
                  <FormField
                    control={form.control}
                    name="riderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Available Rider</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background h-12 border-accent/20 focus:ring-accent">
                              <SelectValue placeholder={loadingRiders ? "Searching online fleet..." : "Choose Dispatch Asset"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {riders?.map(r => (
                              <SelectItem key={r.id} value={r.id} className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                    {r.name?.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm">{r.name}</span>
                                    <span className="text-[10px] uppercase text-muted-foreground">{r.vehicleType || 'Motorcycle'} • Online</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                            {(!riders || riders.length === 0) && !loadingRiders && (
                              <div className="p-4 text-center text-xs text-muted-foreground italic">
                                No online riders available for dispatch.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-xl border border-accent/10 w-full md:w-64 h-24">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Dispatch Queue</p>
                   <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-accent">{riders?.length || 0}</span>
                      <span className="text-xs font-bold text-muted-foreground">Riders Live</span>
                   </div>
                   <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={cn("h-1 w-8 rounded-full", (riders?.length || 0) >= i ? "bg-accent" : "bg-muted")} />
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/30 p-6 border-t flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
               <Banknote className="h-4 w-4" /> Final Settlement: <span className="text-primary font-bold">₱{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => form.reset()} className="h-10 px-6">Discard</Button>
              <Button type="submit" size="lg" className="h-10 px-12 shadow-lg shadow-primary/20 font-bold uppercase tracking-wider">
                Confirm & Dispatch
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
