import { NextResponse } from "next/server"
import { purchases, suppliers, medicines } from "@/lib/mock-data"
import type { Purchase, PurchaseItem } from "@/lib/types"

let purchasesStore = [...purchases]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const supplierId = searchParams.get("supplierId")

  let result = purchasesStore

  if (status) {
    result = result.filter((p) => p.status === status)
  }

  if (supplierId) {
    result = result.filter((p) => p.supplierId === supplierId)
  }

  // Add relations
  const purchasesWithRelations = result.map((purchase) => ({
    ...purchase,
    supplier: suppliers.find((s) => s.id === purchase.supplierId),
    items: purchase.items.map((item) => ({
      ...item,
      medicine: medicines.find((m) => m.id === item.medicineId),
    })),
  }))

  return NextResponse.json(purchasesWithRelations)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const purchaseItems: PurchaseItem[] = body.items.map((item: { medicineId: string; quantity: number; unitPrice: number; batchNumber: string; expiryDate: string }, index: number) => ({
      id: `pi-${Date.now()}-${index}`,
      purchaseId: "",
      medicineId: item.medicineId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      batchNumber: item.batchNumber,
      expiryDate: new Date(item.expiryDate),
    }))

    const totalAmount = purchaseItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      supplierId: body.supplierId,
      purchaseDate: new Date(),
      totalAmount,
      status: "Pending",
      items: purchaseItems.map((item) => ({ ...item, purchaseId: `pur-${Date.now()}` })),
      createdBy: body.createdBy || "user-1",
      notes: body.notes,
    }

    purchasesStore.push(newPurchase)

    return NextResponse.json({ success: true, data: newPurchase }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create purchase" },
      { status: 500 }
    )
  }
}

export { purchasesStore }
