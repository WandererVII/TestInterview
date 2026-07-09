import { NextResponse } from "next/server";
import { issueHistory } from "@/lib/data";

export async function GET() {
  return NextResponse.json(issueHistory);
}
