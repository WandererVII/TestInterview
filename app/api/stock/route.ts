import { NextResponse } from "next/server";
import { materials, getLotsByMaterial, getTotalQuantity } from "@/lib/data";

export async function GET() {
  const stockData = materials.map((material) => {
    const materialLots = getLotsByMaterial(material.id);
    const totalQty = getTotalQuantity(material.id);

    return {
      id: material.id,
      name: material.name,
      unit: material.unit,
      totalQty,
      lotCount: materialLots.length,
      lots: materialLots.map((lot) => ({
        lotNo: lot.lotNo,
        qty: lot.qty,
        expiry: lot.expiry,
      })),
    };
  });

  return NextResponse.json(stockData);
}
