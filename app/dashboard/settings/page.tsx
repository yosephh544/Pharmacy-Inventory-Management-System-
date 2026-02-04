"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  Settings,
  Building,
  Bell,
  Shield,
  Save,
  Loader2,
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [pharmacySettings, setPharmacySettings] = useState({
    name: "PharmaCare Pharmacy",
    address: "123 Health Street, Medical District",
    phone: "+1-555-PHARMA",
    email: "contact@pharmacare.com",
    taxRate: "8",
    lowStockThreshold: "100",
    expiryWarningDays: "90",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    expiryAlerts: true,
    salesReports: true,
    systemUpdates: true,
    emailNotifications: false,
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    })
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your pharmacy system settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pharmacy Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Pharmacy Information
            </CardTitle>
            <CardDescription>Basic details about your pharmacy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pharmName">Pharmacy Name</Label>
              <Input
                id="pharmName"
                value={pharmacySettings.name}
                onChange={(e) =>
                  setPharmacySettings({ ...pharmacySettings, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={pharmacySettings.address}
                onChange={(e) =>
                  setPharmacySettings({ ...pharmacySettings, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={pharmacySettings.phone}
                  onChange={(e) =>
                    setPharmacySettings({ ...pharmacySettings, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={pharmacySettings.email}
                  onChange={(e) =>
                    setPharmacySettings({ ...pharmacySettings, email: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>Configure system behavior and thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                value={pharmacySettings.taxRate}
                onChange={(e) =>
                  setPharmacySettings({ ...pharmacySettings, taxRate: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">Applied to all sales transactions</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStock">Default Low Stock Threshold</Label>
              <Input
                id="lowStock"
                type="number"
                min="0"
                value={pharmacySettings.lowStockThreshold}
                onChange={(e) =>
                  setPharmacySettings({ ...pharmacySettings, lowStockThreshold: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">Alerts when stock falls below this level</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDays">Expiry Warning Days</Label>
              <Input
                id="expiryDays"
                type="number"
                min="1"
                value={pharmacySettings.expiryWarningDays}
                onChange={(e) =>
                  setPharmacySettings({ ...pharmacySettings, expiryWarningDays: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">Days before expiry to show warnings</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose which notifications to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-slate-500">Get notified when items are running low</p>
              </div>
              <Switch
                checked={notificationSettings.lowStockAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, lowStockAlerts: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Expiry Alerts</Label>
                <p className="text-sm text-slate-500">Warnings for items nearing expiration</p>
              </div>
              <Switch
                checked={notificationSettings.expiryAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, expiryAlerts: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Sales Reports</Label>
                <p className="text-sm text-slate-500">Summary of daily sales activity</p>
              </div>
              <Switch
                checked={notificationSettings.salesReports}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, salesReports: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>System Updates</Label>
                <p className="text-sm text-slate-500">Important system announcements</p>
              </div>
              <Switch
                checked={notificationSettings.systemUpdates}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, systemUpdates: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Access
            </CardTitle>
            <CardDescription>Account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current User</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
                  {user?.role}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Change Password</Label>
              <Input type="password" placeholder="Current password" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input type="password" placeholder="New password" />
              <Input type="password" placeholder="Confirm new password" />
            </div>
            <Button variant="outline" className="w-full">
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
