import { NextResponse } from "next/server"
import { users } from "@/lib/mock-data"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const user = users.find(
      (u) => u.username === username && u.passwordHash === password && u.isActive
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token: `mock-token-${user.id}`,
    })
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    )
  }
}
