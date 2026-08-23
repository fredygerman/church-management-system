import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Support requests are not available at this time. Please try again later." },
    { status: 503 }
  )
}
