import { NextResponse } from "next/server"
import { notifications } from "@/lib/mock-data"

let notificationsStore = [...notifications]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get("unreadOnly") === "true"

  let result = notificationsStore.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (unreadOnly) {
    result = result.filter((n) => !n.isRead)
  }

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, isRead } = body

    const index = notificationsStore.findIndex((n) => n.id === id)
    if (index !== -1) {
      notificationsStore[index] = {
        ...notificationsStore[index],
        isRead,
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update notification" },
      { status: 500 }
    )
  }
}

export { notificationsStore }
