"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, X } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { defaultCryptocurrencies } from "@/lib/store"

export default function SharePage() {
  const searchParams = useSearchParams()
  const [portfolio, setPortfolio] = useState<Array<{
    token: {
      id: string
      name: string
      symbol: string
      logo: string
    }
    percentage: number
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if banner has been dismissed before
    const bannerDismissed = localStorage.getItem('tokenomicsArenaBannerDismissed')
    if (bannerDismissed !== 'true') {
      setShowBanner(true)
    }
  }, [])

  useEffect(() => {
    // Parse URL parameters to get portfolio data
    const params = new URLSearchParams(searchParams)
    const portfolioData: Array<{
      token: {
        id: string
        name: string
        symbol: string
        logo: string
      }
      percentage: number
    }> = []

    // Extract token data from URL parameters
    let index = 1
    while (params.has(`t${index}`) && params.has(`s${index}`)) {
      const symbol = params.get(`t${index}`) || ""
      const percentage = parseFloat(params.get(`s${index}`) || "0")
      
      if (symbol && !isNaN(percentage)) {
        // Find token in default tokens
        const token = defaultCryptocurrencies.find(t => t.symbol === symbol)
        
        if (token) {
          // It's a default token
          portfolioData.push({
            token: {
              id: token.id,
              name: token.name,
              symbol: token.symbol,
              logo: token.logo
            },
            percentage
          })
        } else {
          // It's a custom token - use the symbol itself as the parameter name
          const customName = params.get(symbol) || symbol
          
          portfolioData.push({
            token: {
              id: `custom-${index}`,
              name: customName,
              symbol: symbol,
              logo: "/placeholder.svg"
            },
            percentage
          })
        }
      }
      
      index++
    }

    // Sort by percentage (descending)
    portfolioData.sort((a, b) => b.percentage - a.percentage)
    
    setPortfolio(portfolioData)
    setIsLoading(false)
  }, [searchParams])

  // Function to dismiss the banner and save preference
  const dismissBanner = () => {
    setShowBanner(false)
    localStorage.setItem('tokenomicsArenaBannerDismissed', 'true')
  }

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      {showBanner && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-2 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={dismissBanner}
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </Button>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Tokenomics Arena</CardTitle>
            <CardDescription className="text-base">
    Build a tailored portfolio through simple comparisons.
              Instead of complex charts and technical analysis, we break down the decision-making 
              process into simple choices between two options at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">This is a shared portfolio created by another user. Want to create your own?</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/">Try Tokenomics Arena</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Shared Portfolio</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" size="sm"className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span>Go to Comparison Arena</span>
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">Loading...</p>
        </div>
      ) : portfolio.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No portfolio data found in URL.</p>
          <Button asChild>
            <Link href="/">Go to Comparison Arena</Link>
          </Button>
        </div>
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardDescription>
                Shared portfolio with {portfolio.length} token{portfolio.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {portfolio.map((item, index) => (
                  <div key={item.token.id || index}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src={item.token.logo || "/placeholder.svg"}
                          alt={item.token.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <div>
                          <span className="font-medium">{item.token.name}</span>
                          &nbsp;
                          <span className="text-xs text-muted-foreground">{item.token.symbol}</span>
                        </div>
                      </div>
                      <span className="font-bold">{item.percentage.toFixed(2)}%</span>
                    </div>
                    <Progress value={item.percentage} className="h-2 mb-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
