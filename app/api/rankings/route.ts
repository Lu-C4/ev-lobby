import { NextResponse } from "next/server"
import type { RankingPlayer } from "@/types/ev"

export async function GET() {
  try {
    const res = await fetch("https://vps-9d44e894.vps.ovh.ca/api/rankings", {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`)
    }

    const data: RankingPlayer[] = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 })
  }
}
