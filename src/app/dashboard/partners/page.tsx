"use client"

import { useState } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { supabase } from "@/supabase/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Store, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Phone, 
  User, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  KeyRound,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  FileCode,
  Sparkles
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function PartnersPage() {
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Registration Form
  const [formData, setFormData] = useState({
    name: "",
    category: "Food",
    contact_person: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  })

  // Assign Credentials State
  const [selectedPartnerForCreds, setSelectedPartnerForCreds] = useState<any | null>(null)
  const [credEmail, setCredEmail] = useState("")
  const [credPassword, setCredPassword] = useState("")
  const [showCredPassword, setShowCredPassword] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [copiedPartnerId, setCopiedPartnerId] = useState<string | null>(null)

  // SQL Setup & Sync Modal
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false)
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // Real-time data
  const { data: merchants, isLoading: loadingMerchants, refetch: refetchMerchants } = useSupabaseCollection("merchants", {
    orderBy: { column: "name", ascending: true }
  })
  const { data: allOrders } = useSupabaseCollection("orders")

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if initial credentials provided
    const payload: any = {
      name: formData.name,
      category: formData.category,
      contact_person: formData.contact_person,
      phone: formData.phone,
      address: formData.address,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (formData.email) {
      payload.email = formData.email.trim().toLowerCase()
    }
    if (formData.password) {
      payload.password = formData.password
    }

    const { data: insertedData, error } = await supabase
      .from("merchants")
      .insert(payload)
      .select()
      .single()

    if (error) {
      toast({ 
        title: "Registration Failed", 
        description: error.message, 
        variant: "destructive" 
      })
      return
    }

    // If credentials were provided, sync to Supabase Auth
    if (formData.email && formData.password && insertedData?.id) {
      try {
        await fetch("/api/partners/assign-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId: insertedData.id,
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          }),
        })
      } catch (authErr) {
        console.warn("Auth sync on creation warning:", authErr)
      }
    }

    toast({ title: "Merchant Added", description: `${formData.name} has been successfully registered.` })
    setIsModalOpen(false)
    setFormData({ name: "", category: "Food", contact_person: "", phone: "", address: "", email: "", password: "" })
    if (refetchMerchants) refetchMerchants()
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    await supabase.from("merchants").update({ status: newStatus }).eq('id', id)
    toast({ title: "Status Updated", description: `Merchant is now ${newStatus}.` })
  }

  const handleBulkStatus = async (newStatus: "active" | "inactive") => {
    await supabase.from("merchants").update({ status: newStatus }).in('id', selectedIds)
    toast({ title: "Bulk Update Complete", description: `${selectedIds.length} merchants updated to ${newStatus}.` })
    setSelectedIds([])
  }

  // Handle Opening the Assign Credentials Modal
  const handleOpenCredentials = (merchant: any) => {
    setSelectedPartnerForCreds(merchant)
    const suggestedEmail = merchant.email || `${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@lods.com`
    setCredEmail(suggestedEmail)
    setCredPassword(merchant.password || "123123")
    setShowCredPassword(false)
  }

  // Handle Saving Credentials to Supabase Authentication
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPartnerForCreds) return

    if (!credEmail || !credEmail.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" })
      return
    }

    if (!credPassword || credPassword.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" })
      return
    }

    setIsAssigning(true)
    try {
      const res = await fetch("/api/partners/assign-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: selectedPartnerForCreds.id,
          email: credEmail.trim().toLowerCase(),
          password: credPassword,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to assign credentials.")
      }

      if (result.needsSql) {
        toast({
          title: "Saved to Record (Auth Action Required)",
          description: result.message,
          variant: "default",
        })
        setIsSqlModalOpen(true)
      } else {
        toast({
          title: "Mobile Login Active",
          description: `${selectedPartnerForCreds.name} can now log into LODS Mobile app as Merchant.`,
        })
      }

      setSelectedPartnerForCreds(null)
      if (refetchMerchants) refetchMerchants()
    } catch (err: any) {
      toast({
        title: "Assignment Error",
        description: err.message || "Could not save credentials to Supabase Authentication.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Copy Login Credentials Format
  const copyCredentialsToClipboard = (partner: any, email?: string, pass?: string) => {
    const finalEmail = email || partner.email || "No email assigned"
    const finalPass = pass || partner.password || "No password assigned"
    const text = `🏪 LODS Partner App Login
Store: ${partner.name}
Role: Merchant
Email: ${finalEmail}
Password: ${finalPass}
Mobile App: LODS Mobile (Sign in under 'Merchant' tab)`

    navigator.clipboard.writeText(text)
    setCopiedPartnerId(partner.id)
    toast({ title: "Copied to Clipboard", description: "Login credentials formatted for merchant messaging." })
    setTimeout(() => setCopiedPartnerId(null), 3000)
  }

  // Bulk Sync Existing Partners to Supabase Auth
  const handleBulkSyncAuth = async () => {
    setIsSyncingAll(true)
    try {
      const res = await fetch("/api/partners/sync-all", {
        method: "POST",
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || "Failed to sync partners.")

      if (result.needsSql) {
        toast({
          title: "Database Sync Script Required",
          description: "Run the provided SQL script in Supabase SQL editor to complete mobile auth integration.",
        })
      } else {
        toast({
          title: "Sync Complete",
          description: `Successfully synchronized ${result.syncedCount} of ${result.totalFound} partners to Supabase Auth.`,
        })
      }
      if (refetchMerchants) refetchMerchants()
    } catch (err: any) {
      toast({
        title: "Sync Failed",
        description: err.message || "Failed to bulk sync partners.",
        variant: "destructive",
      })
    } finally {
      setIsSyncingAll(false)
    }
  }

  const sqlMigrationCode = `-- ============================================================
-- LODS: Assign Partner Login Credentials for Mobile App
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure columns and safe constraints on public.merchants
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS push_token TEXT DEFAULT NULL;

-- Make name column resilient to avoid 23502 null constraint errors during auth triggers
ALTER TABLE public.merchants ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.merchants ALTER COLUMN name SET DEFAULT 'Partner Merchant';

-- 2. Fix handle_new_user() trigger function to handle existing & new merchants safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Partner Merchant'
  );

  IF v_role = 'rider' THEN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      INSERT INTO public.users (id, email, name, role)
      VALUES (NEW.id, NEW.email, v_name, 'rider')
      ON CONFLICT (id) DO NOTHING;
    END IF;

  ELSIF v_role = 'merchant' THEN
    IF EXISTS (SELECT 1 FROM public.merchants WHERE id = NEW.id) THEN
      UPDATE public.merchants
      SET 
        email = COALESCE(public.merchants.email, NEW.email),
        updated_at = now()
      WHERE id = NEW.id;
    ELSE
      INSERT INTO public.merchants (id, name, email)
      VALUES (NEW.id, v_name, NEW.email)
      ON CONFLICT (id) DO NOTHING;
    END IF;

  ELSIF v_role = 'client' THEN
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = NEW.id) THEN
      INSERT INTO public.clients (
        id, email, full_name, address, contact_no, landmark, latitude, longitude
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', v_name),
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        COALESCE(NEW.raw_user_meta_data->>'contact_no', NEW.raw_user_meta_data->>'phone', ''),
        NEW.raw_user_meta_data->>'landmark',
        NULLIF(NULLIF(NEW.raw_user_meta_data->>'latitude', ''), 'null')::DOUBLE PRECISION,
        NULLIF(NULLIF(NEW.raw_user_meta_data->>'longitude', ''), 'null')::DOUBLE PRECISION
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Function to atomically assign/update credentials in auth.users, auth.identities, and public.merchants
CREATE OR REPLACE FUNCTION public.assign_merchant_credentials(
  merchant_id UUID,
  merchant_email TEXT,
  merchant_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_clean_email TEXT;
  v_merchant_name TEXT;
BEGIN
  v_clean_email := lower(trim(merchant_email));

  SELECT name INTO v_merchant_name FROM public.merchants WHERE id = merchant_id;
  IF v_merchant_name IS NULL THEN
    v_merchant_name := split_part(v_clean_email, '@', 1);
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE id = merchant_id OR email = v_clean_email 
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET 
      email = v_clean_email,
      encrypted_password = crypt(merchant_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_user_meta_data = jsonb_build_object('role', 'merchant', 'name', v_merchant_name),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, '')
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      merchant_id,
      'authenticated',
      'authenticated',
      v_clean_email,
      crypt(merchant_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', 'merchant', 'name', v_merchant_name),
      now(),
      now(),
      '', '', '', ''
    );
    v_user_id := merchant_id;
  END IF;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.merchants
  SET 
    email = v_clean_email,
    password = merchant_password,
    updated_at = now()
  WHERE id = merchant_id;

  RETURN jsonb_build_object('success', true, 'merchant_id', merchant_id, 'email', v_clean_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_merchant_credentials(UUID, TEXT, TEXT) TO authenticated, anon;

-- 4. FIX EXISTING AUTH USERS: Resolve "Database error querying schema"
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change IS NULL;

-- Free up phone unique constraint: ensure users without a phone are NULL, not empty string
UPDATE auth.users
SET phone = NULL
WHERE phone = '';

-- 5. One-time Sync for all existing merchants with email and password
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000', 
  id, 
  'authenticated', 
  'authenticated', 
  lower(trim(email)), 
  crypt(password, gen_salt('bf')),
  now(), 
  '{"provider":"email","providers":["email"]}'::jsonb, 
  jsonb_build_object('role', 'merchant', 'name', COALESCE(name, split_part(email, '@', 1))), 
  now(), 
  now(),
  '', '', '', ''
FROM public.merchants
WHERE email IS NOT NULL 
  AND password IS NOT NULL
  AND id NOT IN (SELECT id FROM auth.users)
  AND lower(trim(email)) NOT IN (SELECT email FROM auth.users)
ON CONFLICT (id) DO UPDATE SET
  confirmation_token = COALESCE(auth.users.confirmation_token, ''),
  recovery_token = COALESCE(auth.users.recovery_token, ''),
  email_change_token_new = COALESCE(auth.users.email_change_token_new, ''),
  email_change = COALESCE(auth.users.email_change, '');

-- 6. Link all auth.users into auth.identities
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
SELECT 
  id,
  id,
  jsonb_build_object('sub', id::text, 'email', lower(trim(email))),
  'email',
  id::text,
  now(),
  now(),
  now()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities)
ON CONFLICT DO NOTHING;`

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode)
    setCopiedSql(true)
    toast({ title: "SQL Copied", description: "Paste and execute this in your Supabase SQL Editor." })
    setTimeout(() => setCopiedSql(false), 3000)
  }

  const filteredMerchants = merchants?.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getActiveOrdersCount = (merchantId: string, merchantName: string) => {
    return allOrders?.filter(o => 
      (o.merchant_id === merchantId || o.merchant_name === merchantName) &&
      ["pending", "in-transit", "picked-up", "assigned"].includes(o.status?.toLowerCase())
    ).length || 0
  }

  const getLifetimeOrdersCount = (merchantId: string, merchantName: string) => {
    return allOrders?.filter(o => 
      o.merchant_id === merchantId || o.merchant_name === merchantName
    ).length || 0
  }

  if (loadingMerchants) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Partner Registry</h2>
          <p className="text-muted-foreground">Manage your ecosystem of merchants and assign mobile login access.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg border">
              <span className="text-xs font-bold text-muted-foreground uppercase">{selectedIds.length} Selected</span>
              <Button variant="ghost" size="sm" onClick={() => handleBulkStatus("active")} className="h-7 text-green-600 hover:text-green-700">Activate</Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkStatus("inactive")} className="h-7 text-destructive hover:text-destructive">Deactivate</Button>
            </div>
          )}

          {/* Mobile Auth Sync & SQL Setup Button */}
          <Button 
            variant="outline" 
            onClick={() => setIsSqlModalOpen(true)}
            className="border-primary/20 hover:bg-primary/5 gap-2 shadow-sm"
          >
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Mobile Auth Sync</span>
          </Button>

          {/* Add Partner Dialog */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Add New Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <form onSubmit={handleAddMerchant}>
                <DialogHeader>
                  <DialogTitle>Register New Merchant</DialogTitle>
                  <DialogDescription>Add a new store or logistics provider to the LODS network.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Store Name</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food & Beverage</SelectItem>
                        <SelectItem value="Grocery">Grocery</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Logistics">Logistics Provider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">Contact</Label>
                    <Input id="contact" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="col-span-3" placeholder="Manager Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">Address</Label>
                    <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="col-span-3" />
                  </div>

                  <div className="border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" /> Optional: Assign Initial Mobile Login
                    </p>
                    <div className="grid grid-cols-4 items-center gap-4 mb-3">
                      <Label htmlFor="init-email" className="text-right text-xs">Login Email</Label>
                      <Input 
                        id="init-email" 
                        type="email" 
                        placeholder="e.g. store@lods.com"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        className="col-span-3" 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="init-pass" className="text-right text-xs">Password</Label>
                      <Input 
                        id="init-pass" 
                        type="password" 
                        placeholder="Initial PIN/Password (min 6 chars)"
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="col-span-3" 
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Complete Registration</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by store name, category, or login email..." 
            className="pl-8 bg-background shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!merchants || merchants.length === 0 ? (
        <Card className="border-dashed py-20 bg-muted/20">
          <CardContent className="flex flex-col items-center text-center">
            <Store className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-2xl font-bold">No Partners Registered</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              Start building your network by adding your first merchant partner.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" /> Initialize First Partner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-12 shadow-md border-none overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectedIds.length === filteredMerchants.length && filteredMerchants.length > 0}
                        onCheckedChange={(checked) => {
                          setSelectedIds(checked ? filteredMerchants.map(m => m.id) : [])
                        }}
                      />
                    </TableHead>
                    <TableHead>Merchant Details & App Login</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(merchant.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(prev => checked ? [...prev, merchant.id] : prev.filter(id => id !== merchant.id))
                          }}
                        />
                      </TableCell>
                      
                      {/* Merchant Details + Mobile Login Indicator */}
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 mt-0.5">
                            <Store className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm flex items-center gap-2">
                              {merchant.name}
                              {merchant.email && merchant.password && (
                                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 py-0 px-1.5 h-4 font-semibold">
                                  App Login Active
                                </Badge>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{merchant.category}</span>
                            
                            {/* Mobile Credentials Info */}
                            {merchant.email ? (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-primary/80">
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/5 border border-primary/20 text-[11px] font-mono">
                                  <KeyRound className="h-2.5 w-2.5 text-primary" />
                                  {merchant.email}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/60">
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 border text-[10px] text-muted-foreground italic">
                                  <Lock className="h-2.5 w-2.5 opacity-40" />
                                  No mobile login set
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" /> {merchant.contact_person || "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {merchant.phone || "No Phone"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary">{getActiveOrdersCount(merchant.id, merchant.name)}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Active Orders</span>
                          </div>
                          <div className="h-8 w-px bg-border" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-accent">{getLifetimeOrdersCount(merchant.id, merchant.name)}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Lifetime</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge 
                          variant={merchant.status === "active" ? "default" : "outline"}
                          className={merchant.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {merchant.status === "active" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {merchant.status}
                        </Badge>
                      </TableCell>

                      {/* Action Column with ASSIGN CREDENTIALS */}
                      <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                            {/* Primary Action: Assign Login Credentials */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenCredentials(merchant)}
                              className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-medium shadow-sm transition-all"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-primary" />
                              <span className="font-semibold text-xs">Assign Login</span>
                            </Button>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleStatus(merchant.id, merchant.status)}
                              className={merchant.status === "active" ? "h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/10" : "h-8 text-xs text-green-600 border-green-500/20 hover:bg-green-500/10"}
                            >
                              {merchant.status === "active" ? "Deactivate" : "Activate"}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Partner Operations</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenCredentials(merchant)}>
                                  <KeyRound className="mr-2 h-4 w-4 text-primary" />
                                  <span>{merchant.email ? "Edit Login Access" : "Assign Login Access"}</span>
                                </DropdownMenuItem>
                                {merchant.email && (
                                  <DropdownMenuItem onClick={() => copyCredentialsToClipboard(merchant)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    <span>Copy Mobile Login</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleStatus(merchant.id, merchant.status)}>
                                  {merchant.status === "active" ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4 text-destructive" />
                                      <span className="text-destructive">Deactivate Partner</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                      <span className="text-green-600">Activate Partner</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG: ASSIGN LOGIN CREDENTIALS TO PARTNER */}
      {/* ========================================================= */}
      <Dialog open={!!selectedPartnerForCreds} onOpenChange={(open) => !open && setSelectedPartnerForCreds(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {selectedPartnerForCreds && (
            <form onSubmit={handleSaveCredentials}>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Assign Mobile Credentials</DialogTitle>
                    <DialogDescription className="text-xs">
                      Set login credentials for <strong>{selectedPartnerForCreds.name}</strong> to log into LODS Mobile App.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Partner Info Summary Card */}
              <div className="p-3 bg-muted/40 rounded-xl border my-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{selectedPartnerForCreds.name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                    {selectedPartnerForCreds.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Contact: {selectedPartnerForCreds.contact_person || "N/A"}</span>
                  <span>{selectedPartnerForCreds.phone || "No phone"}</span>
                </div>
                {selectedPartnerForCreds.address && (
                  <p className="text-[11px] text-muted-foreground truncate">{selectedPartnerForCreds.address}</p>
                )}
              </div>

              <div className="space-y-4 py-2">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cred-email" className="text-xs font-semibold">Login Email</Label>
                    <button
                      type="button"
                      onClick={() => setCredEmail(`${selectedPartnerForCreds.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@lods.com`)}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Suggest @lods.com
                    </button>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="cred-email"
                      type="email"
                      className="pl-9 font-medium"
                      placeholder="merchant@lods.com"
                      value={credEmail}
                      onChange={(e) => setCredEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cred-password" className="text-xs font-semibold">Password / PIN</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCredPassword("123123")}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Default (123123)
                      </button>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          const rand = Math.random().toString(36).slice(-8)
                          setCredPassword(rand)
                        }}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Random
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="cred-password"
                      type={showCredPassword ? "text" : "password"}
                      className="pl-9 pr-10 font-mono text-sm"
                      placeholder="Minimum 6 characters"
                      value={credPassword}
                      onChange={(e) => setCredPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredPassword(!showCredPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCredPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role & LODS Mobile App Indicator */}
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Mobile App Role: Merchant</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This account will be saved in Supabase Authentication and linked to this partner profile.
                    The partner will open <strong>LODS Mobile</strong>, tap the <strong>Merchant</strong> tab, and sign in.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyCredentialsToClipboard(selectedPartnerForCreds, credEmail, credPassword)}
                  className="gap-1.5"
                >
                  {copiedPartnerId === selectedPartnerForCreds.id ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Info</span>
                    </>
                  )}
                </Button>
                <Button type="submit" disabled={isAssigning} className="gap-2">
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving to Auth...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Save & Activate Login</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: MOBILE AUTH SYNC & SUPABASE SQL SETUP */}
      {/* ========================================================= */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">LODS Mobile Authentication Sync</DialogTitle>
                <DialogDescription className="text-xs">
                  Connect Partner Registry with Supabase Authentication for mobile login.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Status of Registered Partners */}
            <div className="p-3 bg-muted/30 rounded-xl border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Partner Accounts Overview</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {merchants?.filter(m => m.email && m.password).length || 0} / {merchants?.length || 0} Assigned
                </Badge>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {merchants?.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-background border text-xs">
                    <div className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.email ? (
                        <span className="font-mono text-[11px] text-muted-foreground">{m.email}</span>
                      ) : (
                        <span className="text-destructive text-[11px] font-medium">No Credentials</span>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setIsSqlModalOpen(false)
                          handleOpenCredentials(m)
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Sync Button */}
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4 text-primary" /> Sync Existing Partners
                </h4>
                <p className="text-xs text-muted-foreground">
                  Synchronize SELAH, JOLLIBEE, and other registered partner credentials directly into Supabase Auth.
                </p>
              </div>
              <Button onClick={handleBulkSyncAuth} disabled={isSyncingAll} className="shrink-0 gap-2">
                {isSyncingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Sync to Auth
              </Button>
            </div>

            {/* Supabase SQL Migration Helper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-primary" /> Supabase SQL Migration Script
                </Label>
                <Button variant="outline" size="sm" onClick={handleCopySql} className="h-7 text-xs gap-1.5">
                  {copiedSql ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Run this once in your <strong>Supabase Dashboard → SQL Editor</strong>. It creates the secure stored procedure to save credentials into <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">auth.users</code> without email verification barriers.
              </p>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {sqlMigrationCode}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsSqlModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
