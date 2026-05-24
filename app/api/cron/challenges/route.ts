import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabaseServer"

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { error } = await supabase.rpc("award_periodic_challenges")

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export const POST = GET

