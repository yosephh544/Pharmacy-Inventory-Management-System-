import { NextResponse } from "next/server"
import { medicines, batches, sales, purchases, getTotalStock } from "@/lib/mock-data"

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  // Calculate low stock items
  const lowStockCount = medicines.filter((m) => {
    const stock = getTotalStock(m.id)
    return stock <= m.reorderLevel
  }).length

  // Calculate expiring items (within 90 days)
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  const expiringCount = batches.filter(
    (b) => new Date(b.expiryDate) <= ninetyDaysFromNow && b.quantity > 0
  ).length

  // Today's sales
  const todaySales = sales.filter((s) => {
    const saleDate = new Date(s.saleDate)
    saleDate.setHours(0, 0, 0, 0)
    return saleDate.getTime() === today.getTime() && s.status === "Completed"
  })

  const todaySalesCount = todaySales.length
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.netAmount, 0)

  // Monthly revenue
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthlyRevenue = sales
    .filter(
      (s) =>
        new Date(s.saleDate) >= firstOfMonth && s.status === "Completed"
    )
    .reduce((sum, s) => sum + s.netAmount, 0)

  // Pending purchases
  const pendingPurchases = purchases.filter((p) => p.status === "Pending").length

  // Recent sales for chart (last 7 days)
  const salesByDay: { date: string; revenue: number; sales: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const daySales = sales.filter((s) => {
      const saleDate = new Date(s.saleDate)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === date.getTime() && s.status === "Completed"
    })

    salesByDay.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: daySales.reduce((sum, s) => sum + s.netAmount, 0),
      sales: daySales.length,
    })
  }

  // Top selling medicines (from sale items)
  const medicineSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  sales
    .filter((s) => s.status === "Completed")
    .forEach((sale) => {
      sale.items.forEach((item) => {
        const medicine = medicines.find((m) => m.id === item.medicineId)
        if (medicine) {
          if (!medicineSales[item.medicineId]) {
            medicineSales[item.medicineId] = {
              name: medicine.name,
              quantity: 0,
              revenue: 0,
            }
          }
          medicineSales[item.medicineId].quantity += item.quantity
          medicineSales[item.medicineId].revenue += item.totalPrice
        }
      })
    })

  const topSellingMedicines = Object.values(medicineSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return NextResponse.json({
    stats: {
      totalMedicines: medicines.filter((m) => m.isActive).length,
      lowStockCount,
      expiringCount,
      todaySales: todaySalesCount,
      todayRevenue,
      monthlyRevenue,
      pendingPurchases,
    },
    salesByDay,
    topSellingMedicines,
  })
}
