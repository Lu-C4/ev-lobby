import { NextResponse } from "next/server";

import { getClanThumbnailByPlayerUid } from "@/lib/evapi";
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const [clanLogo, clanName] = await getClanThumbnailByPlayerUid(uid);
  const clanDetails = { url: clanLogo, name: clanName };

  return NextResponse.json(clanDetails);
}

export async function POST(request) {
  const data = await request.json();
  return NextResponse.json({ message: "User created successfully", data });
}
