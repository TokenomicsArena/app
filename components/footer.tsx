"use client"

import Link from "next/link"
import { Coins, Github, Heart } from "lucide-react"
import { BlueSky } from "./ui/bluesky"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t mt-auto py-6 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">Tokenomics Arena</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover your ideal crypto portfolio through pairwise comparisons.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-medium mb-3">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Homepage
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
            </nav>
          </div>

          {/* Social links */}
          <div>
            <h3 className="font-medium mb-3">Connect</h3>
            <div className="flex flex-col space-y-2">
              <a
                href="https://twitter.com/TokenomicsArena"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
              <a
                href="https://bsky.app/profile/TokenomicsArena.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <BlueSky className="h-4 w-4" />
                Bluesky
              </a>
              <a
                href="https://github.com/TokenomicsArena/app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Tokenomics Arena. All rights reserved.
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> for crypto enthusiasts
          </p>
        </div>
      </div>
    </footer>
  )
}

// Twitter icon component
function Twitter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}
