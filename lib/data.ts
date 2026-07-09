// Data types
export interface Material {
  id: string;
  name: string;
  unit: string;
}

export interface Lot {
  lotNo: string;
  materialId: string;
  qty: number;
  expiry: string;
}

export interface IssueRecord {
  id: string;
  timestamp: string;
  jobNumber: string;
  materialId: string;
  quantity: number;
  lotsDeducted: Array<{
    lotNo: string;
    qty: number;
  }>;
}

// Initial data
export const materials: Material[] = [
  { id: "FILM-PET12", name: "ฟิล์ม PET 12µ", unit: "kg" },
  { id: "INK-RED", name: "หมึกแดง", unit: "kg" },
  { id: "GLUE-SF", name: "กาว Solvent-Free", unit: "kg" },
];

export const lots: Lot[] = [
  { lotNo: "L-001", materialId: "FILM-PET12", qty: 100, expiry: "2026-09-30" },
  { lotNo: "L-002", materialId: "FILM-PET12", qty: 80, expiry: "2026-08-15" },
  { lotNo: "L-003", materialId: "INK-RED", qty: 25, expiry: "2026-12-01" },
  { lotNo: "L-004", materialId: "GLUE-SF", qty: 40, expiry: "2026-07-20" },
];

export const issueHistory: IssueRecord[] = [];

// Helper functions
export function getLotsByMaterial(materialId: string): Lot[] {
  return lots.filter((lot) => lot.materialId === materialId);
}

// Get total quantity of a materialId
export function getTotalQuantity(materialId: string): number {
  return getLotsByMaterial(materialId).reduce((sum, lot) => sum + lot.qty, 0);
}

export function getMaterialById(id: string): Material | undefined {
  return materials.find((m) => m.id === id);
}

// FEFO (First Expire, First Out) deduction logic
export function deductFromLots(
  materialId: string,
  quantity: number,
): {
  success: boolean;
  lotsDeducted: Array<{ lotNo: string; qty: number }>;
  message: string;
} {
  const materialLots = getLotsByMaterial(materialId);

  // Sort by expiry date (earliest first)
  const sortedLots = [...materialLots].sort(
    (a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime(),
  );

  const totalAvailable = sortedLots.reduce((sum, lot) => sum + lot.qty, 0);

  if (totalAvailable < quantity) {
    return {
      success: false,
      lotsDeducted: [],
      message: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`,
    };
  }

  const lotsDeducted: Array<{ lotNo: string; qty: number }> = [];
  let remainingToDeduct = quantity;

  for (const lot of sortedLots) {
    if (remainingToDeduct <= 0) break;

    const lotIndex = lots.findIndex((l) => l.lotNo === lot.lotNo);
    if (lotIndex === -1) continue;

    const deductAmount = Math.min(lots[lotIndex].qty, remainingToDeduct);
    lots[lotIndex].qty -= deductAmount;
    lotsDeducted.push({ lotNo: lot.lotNo, qty: deductAmount });
    remainingToDeduct -= deductAmount;
  }

  return {
    success: true,
    lotsDeducted,
    message: `Successfully issued ${quantity} units`,
  };
}

export function addIssueRecord(
  record: Omit<IssueRecord, "id" | "timestamp">,
): IssueRecord {
  const newRecord: IssueRecord = {
    ...record,
    id: `ISSUE-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  issueHistory.push(newRecord);
  return newRecord;
}
