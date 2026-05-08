"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import * as z from "zod"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { supabase } from "@/supabase/config"
import { Sparkles, Loader2, Package, MapPin, Store, User, ShoppingCart, Plus, Trash2, Banknote, Truck, Navigation, Search, Grid, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  // const firestore = useFirestore() // Removed
  const { toast } = useToast()

  const { data: merchants, isLoading: loadingMerchants } = useSupabaseCollection("merchants", {
    filter: { column: "status", operator: "==", value: "active" },
    orderBy: { column: "name", ascending: true }
  })

  const { data: riders, isLoading: loadingRiders } = useSupabaseCollection("users", {
    filter: { column: "role", operator: "==", value: "rider" },
    // status filter handled in component logic or query if possible
  })

  const { data: rates } = useSupabaseCollection("delivery_rates", {
    orderBy: { column: "location", ascending: true }
  })

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

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const merchantId = form.watch("merchantId")

  const { data: menuItems, isLoading: loadingMenu } = useSupabaseCollection("menu_items", {
    filter: merchantId ? { column: "merchant_id", operator: "==", value: merchantId } : undefined,
    orderBy: { column: "name", ascending: true }
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
        rate.location?.toLowerCase().includes(deliveryAddressWatch.toLowerCase())
      ).slice(0, 5)
      setAddressSuggestions(filtered)
    } else {
      setAddressSuggestions([])
    }
  }, [deliveryAddressWatch, rates])

  const calculateSubtotal = () => {
    return itemsWatch.reduce((acc, item) => {
      const q = Number(item.qty) || 0
      const p = Number(item.price) || 0
      return acc + (q * p)
    }, 0)
  }

  const subtotal = calculateSubtotal()
  const currentFee = Number(deliveryFeeWatch)
  const grandTotal = subtotal + (isNaN(currentFee) ? 0 : currentFee)

  const handleSelectSuggestion = (rate: any) => {
    const feeValue = Number(rate.fee || rate.delivery_fee || 0)
    form.setValue("deliveryAddress", rate.location)
    form.setValue("deliveryFee", isNaN(feeValue) ? 0 : feeValue)
    setShowSuggestions(false)
    toast({
      title: "Rate Synchronized",
      description: `Delivery fee for ${rate.location} set to ₱${feeValue}.`,
    })
  }

  const handleSelectItemFromMenu = (item: any) => {
    // If first item is empty, update it. Otherwise append.
    const currentItems = form.getValues("items")
    if (currentItems.length === 1 && !currentItems[0].name && currentItems[0].price === 0) {
      form.setValue(`items.0`, {
        name: item.name,
        qty: 1,
        price: Number(item.price) || 0
      })
    } else {
      append({
        name: item.name,
        qty: 1,
        price: Number(item.price) || 0
      })
    }
    
    toast({
      title: "Item Added",
      description: `${item.name} added to manifest.`,
    })
  }

  async function onSubmit(values: z.infer<typeof pabiliSchema>) {
    const selectedMerchant = merchants?.find(m => m.id === values.merchantId)
    const selectedRider = riders?.find(r => r.id === values.riderId)

    const { error } = await supabase.from("orders").insert({
      booking_no: `PABILI-${Math.floor(10000 + Math.random() * 90000)}`,
      service_type: "pabili",
      customer_name: values.customerName,
      customer_email: values.customerEmail,
      customer_phone: values.customerPhone,
      merchant_id: values.merchantId,
      merchant_name: selectedMerchant?.name || "Generic Merchant",
      delivery_address: values.deliveryAddress,
      items: values.items.map(item => ({
        ...item,
        total: item.qty * item.price
      })),
      rider_id: values.riderId,
      rider_name: selectedRider?.name || "Assigned Rider",
      status: "assigned",
      subtotal: subtotal,
      delivery_fee: Number(values.deliveryFee),
      final_total: grandTotal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive"
      })
      return
    }

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
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background flex-1">
                              <SelectValue placeholder={loadingMerchants ? "Fetching partners..." : "Select Merchant"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {merchants?.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name} ({m.category})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="px-3 border-primary/20 hover:bg-primary/5"
                              disabled={!merchantId || loadingMenu}
                            >
                              <Grid className="h-4 w-4 mr-2 text-primary" />
                              {loadingMenu ? <Loader2 className="h-4 w-4 animate-spin" /> : "Browse Menu"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-primary" />
                                {merchants?.find(m => m.id === merchantId)?.name}'s Menu
                              </DialogTitle>
                              <DialogDescription>
                                Click an item to add it to the order manifest.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
                              {menuItems?.map((item) => (
                                <Card 
                                  key={item.id} 
                                  className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg bg-muted/30 border-dashed"
                                  onClick={() => handleSelectItemFromMenu(item)}
                                >
                                  <CardContent className="p-4 flex flex-col gap-3">
                                    <div className="aspect-square rounded-lg bg-background flex items-center justify-center relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                                      {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
                                      ) : (
                                        <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center bg-primary/0 group-hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-all">
                                        <Plus className="h-8 w-8 text-primary" />
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                                      <p className="text-[10px] text-muted-foreground line-clamp-2 min-h-[2.5em] mb-2">{item.description || "No description provided."}</p>
                                      <div className="flex items-center justify-between mt-auto">
                                        <span className="text-primary font-bold">₱{Number(item.price).toFixed(2)}</span>
                                        <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-widest">Select</Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              {(!menuItems || menuItems.length === 0) && !loadingMenu && (
                                <div className="col-span-full py-20 text-center space-y-3">
                                  <Package className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                                  <p className="text-muted-foreground">No menu items listed for this merchant.</p>
                                  <p className="text-xs text-muted-foreground/60">Digital menu synchronization in progress...</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
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
                                  <span className="text-sm font-bold">{rate.location}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Regional Rate Intelligence</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 font-bold text-primary group-hover:scale-110 transition-transform">
                                <span className="text-xs">₱</span>
                                {rate.delivery_fee}
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
                              <Input 
                                type="number" 
                                {...field} 
                                value={isNaN(field.value) ? "" : field.value}
                                className="bg-background h-8 font-mono text-right font-bold" 
                              />
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
