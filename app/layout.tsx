import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tokenomics Arena",
  description: "Compare cryptocurrencies and build your ideal portfolio through pairwise comparisons",
  generator: 'v0.dev',
  metadataBase: new URL('https://tokenomics-arena.com'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ]
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tokenomics-arena.com',
    title: 'Tokenomics Arena',
    description: 'Discover your ideal crypto portfolio through pairwise comparisons',
    siteName: 'Tokenomics Arena',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tokenomics Arena - Compare cryptocurrencies and build your ideal portfolio'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tokenomics Arena',
    description: 'Discover your ideal crypto portfolio through pairwise comparisons',
    creator: '@TokenomicsArena',
    images: ['/og-image.png']
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get the theme from cookies for server-side rendering
  const cookieStore = await cookies()
  const theme = cookieStore.get("theme")?.value || "system"
  
  // Determine if dark mode should be applied based on theme
  // For "system" preference, we'll default to dark for server rendering
  // Client will adjust based on actual system preference
  const isDarkTheme = theme === "dark" || theme === "system"
  
  return (
    <html lang="en" className={isDarkTheme ? "dark" : ""} style={{ colorScheme: isDarkTheme ? "dark" : "light" }}>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <div className="pt-16 flex-grow">{children}</div>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

import "../styles/globals.css"
