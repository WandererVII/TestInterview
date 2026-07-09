import { NextRequest, NextResponse } from "next/server";
import { deductFromLots, addIssueRecord, getMaterialById } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materialId, quantity, jobNumber } = body;

    if (!materialId || !quantity || !jobNumber) {
      return NextResponse.json(
        { message: "Missing required fields: materialId, quantity, jobNumber" },
        { status: 400 },
      );
    }

    const material = getMaterialById(materialId);
    if (!material) {
      return NextResponse.json(
        { message: "Material not found" },
        { status: 404 },
      );
    }

    const result = deductFromLots(materialId, quantity);

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    const record = addIssueRecord({
      jobNumber,
      materialId,
      quantity,
      lotsDeducted: result.lotsDeducted,
    });

    return NextResponse.json({
      message: result.message,
      record,
    });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
