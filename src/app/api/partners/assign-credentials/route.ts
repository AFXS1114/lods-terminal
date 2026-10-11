import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { merchantId, email, password } = body

    if (!merchantId) {
      return NextResponse.json({ error: "Partner ID is required." }, { status: 400 })
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const authHeader = req.headers.get("authorization")

    // Create client forwarding caller's authorization header for RLS
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Method 1: Try executing the database RPC assign_merchant_credentials
    const { data: rpcData, error: rpcError } = await client.rpc("assign_merchant_credentials", {
      merchant_id: merchantId,
      merchant_email: cleanEmail,
      merchant_password: password,
    })

    if (!rpcError && rpcData?.success) {
      return NextResponse.json({
        success: true,
        message: `Credentials assigned! ${cleanEmail} can now log into LODS Mobile.`,
        authSaved: true,
      })
    }

    // Method 2: If service role key is present, use Supabase Admin Auth
    if (supabaseServiceRoleKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Fetch merchant name
      const { data: mData } = await adminClient
        .from("merchants")
        .select("name")
        .eq("id", merchantId)
        .single()
      const merchantName = mData?.name || cleanEmail.split("@")[0]

      // Check if user already exists
      const { data: userList } = await adminClient.auth.admin.listUsers()
      const existingUser = userList?.users?.find(
        (u) => u.id === merchantId || u.email?.toLowerCase() === cleanEmail
      )

      if (existingUser) {
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          email: cleanEmail,
          password: password,
          email_confirm: true,
          user_metadata: { role: "merchant", name: merchantName },
        })
      } else {
        await adminClient.auth.admin.createUser({
          id: merchantId,
          email: cleanEmail,
          password: password,
          email_confirm: true,
          user_metadata: { role: "merchant", name: merchantName },
        })
      }

      // Update public.merchants table using admin client to bypass RLS
      await adminClient.from("merchants").update({
        email: cleanEmail,
        password: password,
        updated_at: new Date().toISOString(),
      }).eq("id", merchantId)

      return NextResponse.json({
        success: true,
        message: `Credentials assigned and synchronized to Supabase Authentication for ${cleanEmail}.`,
        authSaved: true,
      })
    }

    // Method 3: Update merchants table record and inform user to run SQL migration for auth.users
    const { error: updateError } = await client.from("merchants").update({
      email: cleanEmail,
      password: password,
      updated_at: new Date().toISOString(),
    }).eq("id", merchantId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      partial: true,
      authSaved: false,
      message: `Credentials saved to partner record! Run the Supabase SQL migration script once to activate mobile login in auth.users.`,
      needsSql: true,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to assign partner credentials." },
      { status: 500 }
    )
  }
}
