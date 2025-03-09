"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { RefreshCw, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { useStore } from "@/lib/store"

export default function PortfolioPage() {
  const { history } = useStore()

  // Algorithm parameters with defaults
  const [learningRate, setLearningRate] = useState(0.9)
  const [timeDecay, setTimeDecay] = useState(0.95)
  const [convergenceThreshold, setConvergenceThreshold] = useState(0.0001)
  const [maxIterations, setMaxIterations] = useState(100)
  const [showSettings, setShowSettings] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [recalculateKey, setRecalculateKey] = useState(0) // Used to force recalculation

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

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suggested Portfolio Allocation</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Algorithm Settings
        </Button>
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
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Learning Rate (Alpha): {learningRate.toFixed(2)}</label>
                  <span className="text-xs text-muted-foreground">Controls how quickly allocations adjust</span>
                </div>
                <Slider
                  value={[learningRate]}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onValueChange={(value) => setLearningRate(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
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
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
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
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Maximum Iterations: {maxIterations}</label>
                  <span className="text-xs text-muted-foreground">Safety limit to prevent infinite loops</span>
                </div>
                <Slider
                  value={[maxIterations]}
                  min={10}
                  max={500}
                  step={10}
                  onValueChange={(value) => setMaxIterations(value[0])}
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

      {history.length === 0 ? (
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
                        <span className="font-medium">{item.token.name}</span>
                        <span className="text-xs text-muted-foreground">{item.token.symbol}</span>
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
