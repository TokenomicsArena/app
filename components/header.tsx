"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Coins } from "lucide-react"

export default function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Tokenomics Arena</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Arena
            </Link>
            <Link
              href="/history"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/history") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              History
            </Link>
            <Link
              href="/portfolio"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/portfolio") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Portfolio
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/about") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
            <Link
              href="/settings"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/settings") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
