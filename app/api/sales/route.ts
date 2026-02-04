import { NextResponse } from "next/server"
import { sales, medicines, batches, generateInvoiceNumber } from "@/lib/mock-data"
import type { Sale, SaleItem } from "@/lib/types"

let salesStore = [...sales]
let batchesStore = [...batches]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const status = searchParams.get("status")

  let result = salesStore

  if (startDate) {
    result = result.filter((s) => new Date(s.saleDate) >= new Date(startDate))
  }

  if (endDate) {
    result = result.filter((s) => new Date(s.saleDate) <= new Date(endDate))
  }

  if (status) {
    result = result.filter((s) => s.status === status)
  }

  // Add medicine details to items
  const salesWithDetails = result.map((sale) => ({
    ...sale,
    items: sale.items.map((item) => ({
      ...item,
      medicine: medicines.find((m) => m.id === item.medicineId),
    })),
  }))

  return NextResponse.json(salesWithDetails)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const saleItems: SaleItem[] = body.items.map((item: { medicineId: string; batchId: string; quantity: number; unitPrice: number; discount?: number }, index: number) => {
      // Update batch quantity
      const batchIndex = batchesStore.findIndex((b) => b.id === item.batchId)
      if (batchIndex !== -1) {
        batchesStore[batchIndex] = {
          ...batchesStore[batchIndex],
          quantity: batchesStore[batchIndex].quantity - item.quantity,
        }
      }

      return {
        id: `si-${Date.now()}-${index}`,
        saleId: "",
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        totalPrice: item.quantity * item.unitPrice - (item.discount || 0),
      }
    })

    const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const discount = body.discount || 0
    const tax = (totalAmount - discount) * 0.08 // 8% tax
    const netAmount = totalAmount - discount + tax

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      saleDate: new Date(),
      customerName: body.customerName,
      totalAmount,
      discount,
      tax,
      netAmount,
      paymentMethod: body.paymentMethod || "Cash",
      status: "Completed",
      items: saleItems.map((item) => ({ ...item, saleId: `sale-${Date.now()}` })),
      soldBy: body.soldBy || "user-1",
      notes: body.notes,
    }

    salesStore.push(newSale)

    return NextResponse.json({ success: true, data: newSale }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create sale" },
      { status: 500 }
    )
  }
}

export { salesStore }
