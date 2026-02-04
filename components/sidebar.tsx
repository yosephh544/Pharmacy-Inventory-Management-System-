"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Pharmacist", "Staff"] },
  { name: "Medicines", href: "/dashboard/medicines", icon: Pill, roles: ["Admin", "Pharmacist", "Staff"] },
  { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart, roles: ["Admin", "Pharmacist", "Staff"] },
  { name: "Purchases", href: "/dashboard/purchases", icon: Package, roles: ["Admin", "Pharmacist"] },
  { name: "Suppliers", href: "/dashboard/suppliers", icon: Users, roles: ["Admin", "Pharmacist"] },
  { name: "Reports", href: "/dashboard/reports", icon: FileText, roles: ["Admin"] },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["Admin", "Pharmacist", "Staff"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["Admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const filteredNavigation = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const NavLinks = () => (
    <>
      {filteredNavigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-teal-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between bg-slate-900 px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">PharmaCare</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-slate-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 transform bg-slate-900 transition-transform lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex h-full flex-col gap-2 p-4">
          <NavLinks />
          <div className="mt-auto border-t border-slate-700 pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{user?.fullName}</p>
                    <p className="text-xs text-slate-400">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 bg-slate-900 lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">PharmaCare</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <NavLinks />
          </nav>

          {/* User menu */}
          <div className="border-t border-slate-700 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{user?.fullName}</p>
                    <p className="text-xs text-slate-400">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  )
}
