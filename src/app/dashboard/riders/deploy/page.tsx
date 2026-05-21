"use client"

import { useState } from "react"
import Link from "next/link"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { supabase } from "@/supabase/config"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Truck } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const itemSchema = z.object({
  description: z.string().min(1, "Required"),
  amount: z.coerce.number().min(0, "Must be positive"),
})

const formSchema = z.object({
  riderId: z.string().min(1, "Please select a rider"),
  date: z.string().min(1, "Required"),
  budget: z.array(itemSchema),
  gasBudget: z.array(itemSchema),
})

export default function DeployRidersPage() {
  const { data: users, isLoading: loadingUsers } = useSupabaseCollection("users")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Filter users to get riders (assuming role field or just list all if not available)
  const riders = users?.filter((u: any) => u.role === 'rider' || u.is_rider === true) || users || []

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riderId: "",
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      budget: [{ description: "Initial Float", amount: 0 }],
      gasBudget: [{ description: "Daily Gas", amount: 0 }],
    },
  })

  const { fields: budgetFields, append: appendBudget, remove: removeBudget } = useFieldArray({
    control: form.control,
    name: "budget",
  })

  const { fields: gasFields, append: appendGas, remove: removeGas } = useFieldArray({
    control: form.control,
    name: "gasBudget",
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    const selectedRider = users?.find((u: any) => u.id === values.riderId)
    const riderName = selectedRider?.name || "Unknown Rider"

    const { error } = await supabase.from('rider_deployments').insert({
      rider_id: values.riderId,
      rider_name: riderName,
      date: values.date,
      budget: values.budget,
      gas_budget: values.gasBudget,
    })

    setIsSubmitting(false)

    if (error) {
      toast({
        title: "Error deploying rider",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Rider deployed successfully!",
      description: `Rider ${riderName} has been deployed for ${values.date}.`,
    })

    form.reset({
      riderId: "",
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      budget: [{ description: "Initial Float", amount: 0 }],
      gasBudget: [{ description: "Daily Gas", amount: 0 }],
    })
  }

  if (loadingUsers) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Deploy Riders</h2>
        <p className="text-muted-foreground">Assign budget and gas allowance before riders start their day.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-md border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Deployment Details
              </CardTitle>
              <CardDescription>Select rider and set the date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="riderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Rider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a rider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {riders.map((rider: any) => (
                            <SelectItem key={rider.id} value={rider.id}>
                              {rider.name || rider.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget Section */}
          <Card className="shadow-md border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Budget Allocation</CardTitle>
                <CardDescription>Add budget items for the rider.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendBudget({ description: "", amount: 0 })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name={`budget.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Food" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`budget.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeBudget(index)} disabled={budgetFields.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gas Budget Section */}
          <Card className="shadow-md border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gas Budget</CardTitle>
                <CardDescription>Add gas allowance items.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendGas({ description: "", amount: 0 })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {gasFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name={`gasBudget.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Shell" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`gasBudget.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeGas(index)} disabled={gasFields.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                "Deploy Rider"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
