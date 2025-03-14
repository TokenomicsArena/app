"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Settings, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore, getNormalizedPairKey, defaultCryptocurrencies } from "@/lib/store"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function PortfolioPage() {
  const { history } = useStore()
  const router = useRouter()

  // Algorithm parameters with defaults
  const [learningRate, setLearningRate] = useState(0.9)
  const [timeDecay, setTimeDecay] = useState(0.95)
  const [convergenceThreshold, setConvergenceThreshold] = useState(0.0001)
  const [maxIterations, setMaxIterations] = useState(100)
  const [showSettings, setShowSettings] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [recalculateKey, setRecalculateKey] = useState(0) // Used to force recalculation
  const [isLoading, setIsLoading] = useState(true)
  
  // Set loading to false after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100) // Short delay to ensure store is hydrated
    
    return () => clearTimeout(timer)
  }, [])

  // Function to render badges for a token
  const renderTokenBadges = (tokenId: string) => {
    if (history.length === 0) return null
    
    // Find all history items where this token appears
    const tokenHistory = history.filter(
      item => item.crypto1.id === tokenId || item.crypto2.id === tokenId
    )
    
    if (tokenHistory.length === 0) return null

    // Sort by timestamp (newest first)
    const sortedHistory = [...tokenHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {sortedHistory.map(comparison => {
          // Create a unique key for this comparison pair (order-independent)
          const pairKey = getNormalizedPairKey(
            comparison.crypto1.id, 
            comparison.crypto2.id
          )
          
          // Determine if this token was preferred in the comparison
          let isPreferred = false
          let isEqual = false
          let otherToken = null
          
          if (comparison.crypto1.id === tokenId) {
            isEqual = comparison.crypto1AllocationPercent === 50
            isPreferred = comparison.crypto1AllocationPercent > 50
            otherToken = comparison.crypto2
          } else {
            isEqual = comparison.crypto1AllocationPercent === 50
            isPreferred = comparison.crypto1AllocationPercent < 50
            otherToken = comparison.crypto1
          }
          
          return (
            <TooltipProvider key={comparison.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/history#${comparison.id}`}>
                    <Badge 
                      variant="outline"
                      className={`cursor-pointer text-[9px] px-1 py-0 opacity-70 hover:opacity-100 transition-opacity ${
                        isEqual ? "text-gray-500" : 
                        isPreferred ? "text-green-600" : 
                        "text-red-600"
                      }`}
                    >
                      {isEqual ? (
                        '= '
                      ) : isPreferred ? (
                        '> '
                      ) : (
                        '< '
                      )}
                      {otherToken.symbol}
                    </Badge>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">
                    {isEqual 
                      ? `Equal preference with ${otherToken.name}` 
                      : isPreferred 
                        ? `Preferred over ${otherToken.name}` 
                        : `${otherToken.name} preferred`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click to view comparison
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }).filter(Boolean)}
      </div>
    )
  }

  // Calculate optimal portfolio allocation based on history
  const portfolio = useMemo(() => {
    if (history.length === 0) return []

    setIsCalculating(true)

    try {
      // Step 1: Collect all unique tokens from history
      const tokensMap = new Map()

      history.forEach((entry) => {
        if (!tokensMap.has(entry.crypto1.id)) {
          tokensMap.set(entry.crypto1.id, entry.crypto1)
        }
        if (!tokensMap.has(entry.crypto2.id)) {
          tokensMap.set(entry.crypto2.id, entry.crypto2)
        }
      })

      const tokens = Array.from(tokensMap.values())

      // Step 2: Initialize allocations based on frequency
      const tokenAppearances = new Map()
      let totalAppearances = 0

      history.forEach((entry) => {
        tokenAppearances.set(entry.crypto1.id, (tokenAppearances.get(entry.crypto1.id) || 0) + 1)
        tokenAppearances.set(entry.crypto2.id, (tokenAppearances.get(entry.crypto2.id) || 0) + 1)
        totalAppearances += 2
      })

      const allocation = new Map()
      tokens.forEach((token) => {
        allocation.set(token.id, (tokenAppearances.get(token.id) || 0) / totalAppearances)
      })

      // Step 3: Iterative refinement
      const alpha = learningRate
      const decayFactor = timeDecay

      let iterations = 0
      let maxChange = 1.0

      while (maxChange > convergenceThreshold && iterations < maxIterations) {
        const oldAllocation = new Map(allocation)
        maxChange = 0

        // Process history entries in chronological order
        const sortedHistory = [...history].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )

        sortedHistory.forEach((entry, i) => {
          const timeWeight = Math.pow(decayFactor, sortedHistory.length - 1 - i)

          const tokenA = entry.crypto1.id
          const tokenB = entry.crypto2.id
          const prefA = entry.crypto1AllocationPercent / 100
          const prefB = 1 - prefA

          // Current normalized allocations for this pair
          const allocA = allocation.get(tokenA) || 0
          const allocB = allocation.get(tokenB) || 0
          const sumAB = allocA + allocB

          if (sumAB > 0) {
            const currANorm = allocA / sumAB

            // Calculate adjustment based on difference from preference
            const deltaA = (prefA - currANorm) * alpha * timeWeight

            // Update allocations
            allocation.set(tokenA, allocA + deltaA * sumAB)
            allocation.set(tokenB, allocB - deltaA * sumAB)

            // Ensure non-negative
            allocation.set(tokenA, Math.max(0, allocation.get(tokenA) || 0))
            allocation.set(tokenB, Math.max(0, allocation.get(tokenB) || 0))
          }
        })

        // Normalize to ensure sum = 1
        const total = Array.from(allocation.values()).reduce((sum, val) => sum + val, 0)

        allocation.forEach((value, key) => {
          allocation.set(key, value / total)
        })

        // Check convergence
        allocation.forEach((value, key) => {
          const change = Math.abs(value - (oldAllocation.get(key) || 0))
          maxChange = Math.max(maxChange, change)
        })

        iterations += 1
      }

      // Step 4: Convert to array and add token info
      const result = Array.from(allocation.entries()).map(([id, percentage]) => {
        const token = tokensMap.get(id)
        return {
          token,
          percentage: percentage * 100,
        }
      })

      // Sort by percentage (descending)
      return result.sort((a, b) => b.percentage - a.percentage)
    } catch (error) {
      console.error("Error calculating portfolio:", error)
      return []
    } finally {
      setIsCalculating(false)
    }
  }, [history, learningRate, timeDecay, convergenceThreshold, maxIterations, recalculateKey])

  // Calculate total investment value (assuming $10,000)
  const totalInvestment = 10000

  const handleRecalculate = () => {
    // Force re-render to recalculate portfolio
    setIsCalculating(true)
    setRecalculateKey((prev) => prev + 1)
  }

  // Generate share URL with portfolio data and copy to clipboard
  const handleShare = () => {
    if (portfolio.length === 0) {
      toast({
        title: "Nothing to share",
        description: "Your portfolio is empty",
        variant: "destructive"
      })
      return
    }

    // Create URL parameters
    const params = new URLSearchParams()
    
    // Get top 10 tokens or all if less than 10
    const topTokens = portfolio.filter(item => item.percentage > 0).slice(0, 10)
    
    // Add tokens to URL parameters
    topTokens.forEach((item, index) => {
      const tokenNumber = index + 1
      params.set(`t${tokenNumber}`, item.token.symbol)
      params.set(`s${tokenNumber}`, item.percentage.toFixed(2))
      
      // For custom tokens or tokens not in the default list, add the name
      const isDefaultToken = defaultCryptocurrencies.some(t => t.symbol === item.token.symbol)
      if (!isDefaultToken) {
        // Use the token symbol as the parameter name for the custom name
        params.set(item.token.symbol, item.token.name)
      }
    })
    
    // Generate full share URL
    const shareUrl = `${window.location.origin}/share?${params.toString()}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: "URL copied!",
          description: "Share link has been copied to clipboard",
        })
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Could not copy URL to clipboard",
          variant: "destructive"
        })
      })
  }

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex items-center gap-2 justify-center"
          >
            <Link href="/"><ArrowLeft className="h-4 w-4 inline lg:hidden mr-1" /> Back to Arena</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 justify-center"
          >
            <Settings className="h-4 w-4" />
            <span>Algorithm Settings</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2 justify-center"
            disabled={portfolio.length === 0 || isLoading}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      <Collapsible open={showSettings} onOpenChange={setShowSettings} className="mb-8">
        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Parameters</CardTitle>
              <CardDescription>
                Adjust these parameters to fine-tune how the algorithm calculates your optimal portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between gap-1">
                  <label className="text-sm font-medium">Learning Rate (Alpha): {learningRate.toFixed(2)}</label>
                  <span className="text-xs text-muted-foreground">Controls how quickly allocations adjust</span>
                </div>
                <Slider
                  value={[learningRate]}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onValueChange={(value) => setLearningRate(value[0])}
                  thumbClassName="h-6 w-6" // Larger thumb for mobile
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between gap-1">
                  <label className="text-sm font-medium">Time Decay Factor: {timeDecay.toFixed(2)}</label>
                  <span className="text-xs text-muted-foreground">
                    How much newer entries matter compared to older ones
                  </span>
                </div>
                <Slider
                  value={[timeDecay]}
                  min={0.5}
                  max={1}
                  step={0.05}
                  onValueChange={(value) => setTimeDecay(value[0])}
                  thumbClassName="h-6 w-6" // Larger thumb for mobile
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between gap-1">
                  <label className="text-sm font-medium">Convergence Threshold: {convergenceThreshold}</label>
                  <span className="text-xs text-muted-foreground">
                    When change is below this value, simulation stops
                  </span>
                </div>
                <Slider
                  value={[convergenceThreshold]}
                  min={0.00001}
                  max={0.01}
                  step={0.0001}
                  onValueChange={(value) => setConvergenceThreshold(value[0])}
                  thumbClassName="h-6 w-6" // Larger thumb for mobile
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between gap-1">
                  <label className="text-sm font-medium">Maximum Iterations: {maxIterations}</label>
                  <span className="text-xs text-muted-foreground">Safety limit to prevent infinite loops</span>
                </div>
                <Slider
                  value={[maxIterations]}
                  min={10}
                  max={500}
                  step={10}
                  onValueChange={(value) => setMaxIterations(value[0])}
                  thumbClassName="h-6 w-6" // Larger thumb for mobile
                />
              </div>

              <Button onClick={handleRecalculate} className="w-full" disabled={isCalculating}>
                {isCalculating ? "Calculating..." : "Recalculate Portfolio"}
                {!isCalculating && <RefreshCw className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {isLoading ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">Loading...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">You haven't made any selections yet.</p>
          <Button asChild>
            <a href="/">Go to Arena</a>
          </Button>
        </div>
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardDescription>
                Based on {history.length} selection{history.length !== 1 ? "s" : ""} <a href="/history" className="text-primary hover:underline">View history</a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {portfolio.filter(x => !!x.percentage).map((item) => (
                  <div key={item.token.id}>
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
                          &nbsp;
                          {renderTokenBadges(item.token.id)}
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
