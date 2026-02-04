import { NextResponse } from "next/server"
import { batches, medicines, suppliers } from "@/lib/mock-data"
import type { MedicineBatch } from "@/lib/types"

let batchesStore = [...batches]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const medicineId = searchParams.get("medicineId")
  const expiring = searchParams.get("expiring") === "true"

  let result = batchesStore

  if (medicineId) {
    result = result.filter((b) => b.medicineId === medicineId)
  }

  if (expiring) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 90)
    result = result.filter((b) => new Date(b.expiryDate) <= thirtyDaysFromNow)
  }

  // Add relations
  const batchesWithRelations = result.map((b) => ({
    ...b,
    medicine: medicines.find((m) => m.id === b.medicineId),
    supplier: suppliers.find((s) => s.id === b.supplierId),
  }))

  return NextResponse.json(batchesWithRelations)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const newBatch: MedicineBatch = {
      id: `batch-${Date.now()}`,
      medicineId: body.medicineId,
      batchNumber: body.batchNumber,
      quantity: parseInt(body.quantity),
      manufacturingDate: new Date(body.manufacturingDate),
      expiryDate: new Date(body.expiryDate),
      purchasePrice: parseFloat(body.purchasePrice),
      sellingPrice: parseFloat(body.sellingPrice),
      supplierId: body.supplierId,
      receivedDate: new Date(),
    }

    batchesStore.push(newBatch)

    return NextResponse.json({ success: true, data: newBatch }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create batch" },
      { status: 500 }
    )
  }
}

export { batchesStore }
