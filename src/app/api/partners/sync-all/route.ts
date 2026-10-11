import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Fetch all merchants with email and password
    let merchantsData = null

    if (supabaseServiceRoleKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data } = await adminClient
        .from("merchants")
        .select("id, name, email, password")
        .not("email", "is", null)
        .not("password", "is", null)
      merchantsData = data
    } else {
      const { data } = await client
        .from("merchants")
        .select("id, name, email, password")
        .not("email", "is", null)
        .not("password", "is", null)
      merchantsData = data
    }

    if (!merchantsData || merchantsData.length === 0) {
      return NextResponse.json({ message: "No partners with credentials found to sync.", syncedCount: 0 })
    }

    let syncedCount = 0
    const errors: string[] = []

    for (const m of merchantsData) {
      if (!m.email || !m.password) continue

      // Try RPC first
      const { data: rpcData, error: rpcErr } = await client.rpc("assign_merchant_credentials", {
        merchant_id: m.id,
        merchant_email: m.email.toLowerCase().trim(),
        merchant_password: m.password,
      })

      if (!rpcErr && rpcData?.success) {
        syncedCount++
        continue
      }

      // If service role key is present
      if (supabaseServiceRoleKey) {
        try {
          const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })

          const { data: userList } = await adminClient.auth.admin.listUsers()
          const cleanEmail = m.email.toLowerCase().trim()
          const existingUser = userList?.users?.find(
            (u) => u.id === m.id || u.email?.toLowerCase() === cleanEmail
          )

          if (existingUser) {
            await adminClient.auth.admin.updateUserById(existingUser.id, {
              email: cleanEmail,
              password: m.password,
              email_confirm: true,
              user_metadata: { role: "merchant", name: m.name },
            })
          } else {
            await adminClient.auth.admin.createUser({
              id: m.id,
              email: cleanEmail,
              password: m.password,
              email_confirm: true,
              user_metadata: { role: "merchant", name: m.name },
            })
          }
          syncedCount++
        } catch (e: any) {
          errors.push(`${m.name}: ${e.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalFound: merchantsData.length,
      syncedCount,
      errors: errors.length > 0 ? errors : undefined,
      needsSql: syncedCount === 0 && !supabaseServiceRoleKey,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to sync partners." },
      { status: 500 }
    )
  }
}
