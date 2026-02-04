import { NextResponse } from "next/server"
import { suppliers } from "@/lib/mock-data"
import type { Supplier } from "@/lib/types"

let suppliersStore = [...suppliers]

export async function GET() {
  return NextResponse.json(suppliersStore.filter((s) => s.isActive))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      isActive: true,
      createdAt: new Date(),
    }

    suppliersStore.push(newSupplier)

    return NextResponse.json({ success: true, data: newSupplier }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create supplier" },
      { status: 500 }
    )
  }
}

export { suppliersStore }
