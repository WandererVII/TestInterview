import {
  deductFromLots,
  getTotalQuantity,
  getLotsByMaterial,
  getMaterialById,
  lots,
  materials,
  issueHistory,
  addIssueRecord,
} from "../data";

// Reset data before each test
beforeEach(() => {
  lots.length = 0;
  lots.push(
    { lotNo: "L-001", materialId: "FILM-PET12", qty: 100, expiry: "2026-09-30" },
    { lotNo: "L-002", materialId: "FILM-PET12", qty: 80, expiry: "2026-08-15" },
    { lotNo: "L-003", materialId: "INK-RED", qty: 25, expiry: "2026-12-01" },
    { lotNo: "L-004", materialId: "GLUE-SF", qty: 40, expiry: "2026-07-20" }
  );
  issueHistory.length = 0;
});

describe("FEFO Deduction Logic", () => {
  test("should deduct from earliest expiring lot first", () => {
    const result = deductFromLots("FILM-PET12", 50);
    
    expect(result.success).toBe(true);
    expect(result.lotsDeducted).toHaveLength(1);
    expect(result.lotsDeducted[0].lotNo).toBe("L-002"); // Expires 2026-08-15 (earliest)
    expect(result.lotsDeducted[0].qty).toBe(50);
    
    // Verify lot quantities
    const l002 = lots.find((l) => l.lotNo === "L-002");
    expect(l002?.qty).toBe(30); // 80 - 50
  });

  test("should deduct from multiple lots when first lot is insufficient", () => {
    const result = deductFromLots("FILM-PET12", 100);
    
    expect(result.success).toBe(true);
    expect(result.lotsDeducted).toHaveLength(2);
    
    // First deduction from L-002 (earliest expiry)
    expect(result.lotsDeducted[0].lotNo).toBe("L-002");
    expect(result.lotsDeducted[0].qty).toBe(80);
    
    // Second deduction from L-001
    expect(result.lotsDeducted[1].lotNo).toBe("L-001");
    expect(result.lotsDeducted[1].qty).toBe(20);
    
    // Verify lot quantities
    const l002 = lots.find((l) => l.lotNo === "L-002");
    const l001 = lots.find((l) => l.lotNo === "L-001");
    expect(l002?.qty).toBe(0); // 80 - 80
    expect(l001?.qty).toBe(80); // 100 - 20
  });

  test("should reject over-issuing with insufficient stock", () => {
    const result = deductFromLots("FILM-PET12", 200); // Total available: 180
    
    expect(result.success).toBe(false);
    expect(result.lotsDeducted).toHaveLength(0);
    expect(result.message).toContain("Insufficient stock");
    expect(result.message).toContain("Available: 180");
    expect(result.message).toContain("Requested: 200");
    
    // Verify no quantities were deducted
    const l001 = lots.find((l) => l.lotNo === "L-001");
    const l002 = lots.find((l) => l.lotNo === "L-002");
    expect(l001?.qty).toBe(100);
    expect(l002?.qty).toBe(80);
  });

  test("should handle exact quantity match", () => {
    const result = deductFromLots("FILM-PET12", 180);
    
    expect(result.success).toBe(true);
    expect(result.lotsDeducted).toHaveLength(2);
    expect(result.lotsDeducted[0].qty).toBe(80);
    expect(result.lotsDeducted[1].qty).toBe(100);
    
    // All lots should be empty
    const l001 = lots.find((l) => l.lotNo === "L-001");
    const l002 = lots.find((l) => l.lotNo === "L-002");
    expect(l001?.qty).toBe(0);
    expect(l002?.qty).toBe(0);
  });

  test("should handle single lot deduction", () => {
    const result = deductFromLots("INK-RED", 10);
    
    expect(result.success).toBe(true);
    expect(result.lotsDeducted).toHaveLength(1);
    expect(result.lotsDeducted[0].lotNo).toBe("L-003");
    expect(result.lotsDeducted[0].qty).toBe(10);
    
    const l003 = lots.find((l) => l.lotNo === "L-003");
    expect(l003?.qty).toBe(15); // 25 - 10
  });

  test("should reject deduction for non-existent material", () => {
    const result = deductFromLots("NON-EXISTENT", 10);
    
    expect(result.success).toBe(false);
    expect(result.lotsDeducted).toHaveLength(0);
    expect(result.message).toContain("Insufficient stock");
  });
});

describe("Helper Functions", () => {
  test("getTotalQuantity should sum all lots for a material", () => {
    const total = getTotalQuantity("FILM-PET12");
    expect(total).toBe(180); // 100 + 80
  });

  test("getLotsByMaterial should return only lots for specific material", () => {
    const filmLots = getLotsByMaterial("FILM-PET12");
    expect(filmLots).toHaveLength(2);
    expect(filmLots.every((l) => l.materialId === "FILM-PET12")).toBe(true);
  });

  test("getMaterialById should return correct material", () => {
    const material = getMaterialById("FILM-PET12");
    expect(material).toBeDefined();
    expect(material?.id).toBe("FILM-PET12");
    expect(material?.name).toBe("ฟิล์ม PET 12µ");
  });

  test("getMaterialById should return undefined for non-existent material", () => {
    const material = getMaterialById("NON-EXISTENT");
    expect(material).toBeUndefined();
  });
});

describe("Issue Record Management", () => {
  test("addIssueRecord should create record with timestamp", () => {
    const record = addIssueRecord({
      jobNumber: "JOB-100",
      materialId: "FILM-PET12",
      quantity: 50,
      lotsDeducted: [{ lotNo: "L-002", qty: 50 }],
    });
    
    expect(record.id).toBeDefined();
    expect(record.id).toMatch(/^ISSUE-/);
    expect(record.timestamp).toBeDefined();
    expect(record.jobNumber).toBe("JOB-100");
    expect(record.materialId).toBe("FILM-PET12");
    expect(record.quantity).toBe(50);
    expect(record.lotsDeducted).toHaveLength(1);
    
    expect(issueHistory).toHaveLength(1);
  });

  test("addIssueRecord should append to history", () => {
    addIssueRecord({
      jobNumber: "JOB-100",
      materialId: "FILM-PET12",
      quantity: 50,
      lotsDeducted: [{ lotNo: "L-002", qty: 50 }],
    });
    
    addIssueRecord({
      jobNumber: "JOB-101",
      materialId: "INK-RED",
      quantity: 10,
      lotsDeducted: [{ lotNo: "L-003", qty: 10 }],
    });
    
    expect(issueHistory).toHaveLength(2);
    expect(issueHistory[0].jobNumber).toBe("JOB-100");
    expect(issueHistory[1].jobNumber).toBe("JOB-101");
  });
});
