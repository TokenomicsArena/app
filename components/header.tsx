"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Coins, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Header() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Close menu when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false)
    }
  }, [isMobile])

  const isActive = (path: string) => {
    return pathname === path
  }

  const navLinks = [
    { href: "/", label: "Arena" },
    { href: "/history", label: "History" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/about", label: "About" },
    { href: "/settings", label: "Settings" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Tokenomics Arena</span>
          </Link>

          {isMobile ? (
            <>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              {isMenuOpen && (
                <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg animate-in slide-in-from-top-5">
                  <nav className="flex flex-col py-4 px-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`py-3 px-4 text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md ${
                          isActive(link.href) ? "text-primary bg-gray-50 dark:bg-gray-900" : "text-muted-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}
            </>
          ) : (
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
