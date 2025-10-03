
import { NextResponse } from "next/server";
import { MODEL, getAiClient } from "@/lib/ai";

export async function GET() {
  const client = getAiClient();
  if (!client) {
    return NextResponse.json({ ok: true, model: "disabled", text: "pong" });
  }
  return NextResponse.json({ ok: true, model: MODEL, text: "pong" });
}
