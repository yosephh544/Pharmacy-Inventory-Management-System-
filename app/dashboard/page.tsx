"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Pill,
  AlertTriangle,
  Clock,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardData {
  stats: {
    totalMedicines: number
    lowStockCount: number
    expiringCount: number
    todaySales: number
    todayRevenue: number
    monthlyRevenue: number
    pendingPurchases: number
  }
  salesByDay: { date: string; revenue: number; sales: number }[]
  topSellingMedicines: { name: string; quantity: number; revenue: number }[]
}

const COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"]

export default function DashboardPage() {
  const { data, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 30000,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoading || !mounted) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 rounded bg-slate-200" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const salesByDay = data?.salesByDay || []
  const topSellingMedicines = data?.topSellingMedicines || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome to PharmaCare Inventory Management</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/sales/new">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-teal-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Medicines</CardTitle>
            <Pill className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalMedicines || 0}</div>
            <p className="text-xs text-slate-500">Active products in inventory</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.lowStockCount || 0}</div>
            <Link
              href="/dashboard/medicines?filter=lowStock"
              className="text-xs text-amber-600 hover:underline"
            >
              View low stock items
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Expiring Soon</CardTitle>
            <Clock className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.expiringCount || 0}</div>
            <Link
              href="/dashboard/medicines?filter=expiring"
              className="text-xs text-red-600 hover:underline"
            >
              View expiring items
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today&apos;s Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats?.todayRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-slate-500">{stats?.todaySales || 0} sales today</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Monthly Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats?.monthlyRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-slate-500">This month total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Purchases</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.pendingPurchases || 0}</div>
            <Link
              href="/dashboard/purchases?status=Pending"
              className="text-xs text-blue-600 hover:underline"
            >
              View pending orders
            </Link>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/dashboard/medicines/new">
              <Button variant="outline" size="sm">
                Add Medicine
              </Button>
            </Link>
            <Link href="/dashboard/purchases/new">
              <Button variant="outline" size="sm">
                New Purchase
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline" size="sm">
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Daily revenue for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Medicines */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Medicines</CardTitle>
            <CardDescription>Based on quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            {topSellingMedicines.length > 0 ? (
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="h-[200px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topSellingMedicines}
                        dataKey="quantity"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={false}
                      >
                        {topSellingMedicines.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {topSellingMedicines.map((medicine, index) => (
                    <div key={medicine.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="flex-1 truncate text-sm text-slate-600">{medicine.name}</span>
                      <span className="text-sm font-medium text-slate-900">{medicine.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-slate-500">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest notifications and alerts</CardDescription>
          </div>
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.lowStockCount && stats.lowStockCount > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Low Stock Warning</p>
                  <p className="text-sm text-amber-700">
                    {stats.lowStockCount} item(s) are running low on stock
                  </p>
                </div>
              </div>
            ) : null}
            {stats?.expiringCount && stats.expiringCount > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <Clock className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Expiry Alert</p>
                  <p className="text-sm text-red-700">
                    {stats.expiringCount} batch(es) expiring within 90 days
                  </p>
                </div>
              </div>
            ) : null}
            {(!stats?.lowStockCount || stats.lowStockCount === 0) &&
              (!stats?.expiringCount || stats.expiringCount === 0) && (
                <p className="text-center text-slate-500">No alerts at this time</p>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
