import { NextResponse } from "next/server"
import { medicines, categories, batches, getTotalStock } from "@/lib/mock-data"
import type { Medicine } from "@/lib/types"

// In-memory store for mutations (resets on server restart)
let medicinesStore = [...medicines]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.toLowerCase()
  const categoryId = searchParams.get("categoryId")
  const lowStock = searchParams.get("lowStock") === "true"
  const expiring = searchParams.get("expiring") === "true"

  let result = medicinesStore.filter((m) => m.isActive)

  if (search) {
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        m.genericName.toLowerCase().includes(search) ||
        m.manufacturer.toLowerCase().includes(search)
    )
  }

  if (categoryId) {
    result = result.filter((m) => m.categoryId === categoryId)
  }

  // Add stock info and category
  const medicinesWithStock = result.map((m) => {
    const stock = getTotalStock(m.id)
    const medicineBatches = batches.filter((b) => b.medicineId === m.id)
    const nearestExpiry = medicineBatches.length > 0
      ? new Date(Math.min(...medicineBatches.map((b) => new Date(b.expiryDate).getTime())))
      : null

    return {
      ...m,
      category: categories.find((c) => c.id === m.categoryId),
      currentStock: stock,
      isLowStock: stock <= m.reorderLevel,
      nearestExpiry,
    }
  })

  if (lowStock) {
    return NextResponse.json(medicinesWithStock.filter((m) => m.isLowStock))
  }

  if (expiring) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return NextResponse.json(
      medicinesWithStock.filter(
        (m) => m.nearestExpiry && new Date(m.nearestExpiry) <= thirtyDaysFromNow
      )
    )
  }

  return NextResponse.json(medicinesWithStock)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const newMedicine: Medicine = {
      id: `med-${Date.now()}`,
      name: body.name,
      genericName: body.genericName,
      categoryId: body.categoryId,
      manufacturer: body.manufacturer,
      dosageForm: body.dosageForm,
      strength: body.strength,
      unitPrice: parseFloat(body.unitPrice),
      reorderLevel: parseInt(body.reorderLevel),
      description: body.description || "",
      requiresPrescription: body.requiresPrescription || false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    medicinesStore.push(newMedicine)

    return NextResponse.json({ success: true, data: newMedicine }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create medicine" },
      { status: 500 }
    )
  }
}
