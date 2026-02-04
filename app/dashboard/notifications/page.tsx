"use client"

import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  AlertTriangle,
  Clock,
  Info,
  CheckCircle,
  Package,
} from "lucide-react"
import type { Notification } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher
  )

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      })
      mutate("/api/notifications")
    } catch (error) {
      console.error("Failed to mark notification as read", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications?.filter((n) => !n.isRead) || []
      await Promise.all(
        unread.map((n) =>
          fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: n.id, isRead: true }),
          })
        )
      )
      mutate("/api/notifications")
    } catch (error) {
      console.error("Failed to mark all as read", error)
    }
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0

  const getIcon = (type: string) => {
    switch (type) {
      case "LowStock":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "Expiring":
        return <Clock className="h-5 w-5 text-red-500" />
      case "Expired":
        return <Package className="h-5 w-5 text-red-600" />
      case "System":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const getTypeStyles = (type: string, isRead: boolean) => {
    const baseStyles = isRead ? "bg-white" : "bg-slate-50"
    switch (type) {
      case "LowStock":
        return `${baseStyles} border-l-4 border-l-amber-500`
      case "Expiring":
        return `${baseStyles} border-l-4 border-l-red-500`
      case "Expired":
        return `${baseStyles} border-l-4 border-l-red-600`
      case "System":
        return `${baseStyles} border-l-4 border-l-blue-500`
      default:
        return baseStyles
    }
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600">Stay updated with alerts and system messages</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Unread</CardTitle>
            <Bell className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {notifications?.filter((n) => n.type === "LowStock").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Expiry Warnings</CardTitle>
            <Clock className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications?.filter((n) => n.type === "Expiring" || n.type === "Expired").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">System Messages</CardTitle>
            <Info className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {notifications?.filter((n) => n.type === "System").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${getTypeStyles(
                    notification.type,
                    notification.isRead
                  )}`}
                >
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`font-medium ${
                            notification.isRead ? "text-slate-700" : "text-slate-900"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p
                          className={`text-sm ${
                            notification.isRead ? "text-slate-500" : "text-slate-600"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <>
                            <Badge className="bg-teal-100 text-teal-700">New</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              Mark read
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-slate-500">
              <Bell className="mb-2 h-12 w-12 text-slate-300" />
              <p>No notifications</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
