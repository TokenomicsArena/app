"use client"
import Image from "next/image"
import { Info } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

type TokenSelectionProps = {
  cryptoPair: Array<{
    id: string
    name: string
    symbol: string
    logo: string
  }> | null
  allocation: number[]
  explanation: string
  onAllocationChange: (value: number[]) => void
  onExplanationChange: (value: string) => void
}

export default function TokenSelection({
  cryptoPair,
  allocation,
  explanation,
  onAllocationChange,
  onExplanationChange,
}: TokenSelectionProps) {

  // Show loading state if cryptoPair is null
  if (!cryptoPair) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Loading token pairs...</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-center text-muted-foreground mb-4">
        How would you allocate your savings between these two cryptocurrencies?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {cryptoPair.map((crypto, index) => (
          <Card key={crypto.id} className={`border-2 ${index === 0 ? "border-blue-500" : "border-red-500"}`}>
            <CardContent className="p-6 flex flex-col items-center">
              <Image
                src={crypto.logo || "/placeholder.svg"}
                alt={crypto.name}
                width={80}
                height={80}
                className="mb-4"
              />
              <h2 className="text-2xl font-bold">{crypto.name}</h2>
              <p className="text-xl text-muted-foreground">{crypto.symbol}</p>
              <div className="mt-4 text-2xl font-bold">{index === 0 ? (100 - allocation[0]).toFixed(2) : allocation[0].toFixed(2)}%</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">100% {cryptoPair[0].name}</p>
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>

          <p className="text-sm font-medium">50%</p>

          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">100% {cryptoPair[1].name}</p>
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          </div>
        </div>

        <Slider
          value={allocation}
          onValueChange={onAllocationChange}
          max={100}
          min={0}
          step={0.01}
          className="mb-6"
          thumbClassName="h-6 w-6 border-2"
          trackClassName="h-3"
        />
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4" />
          <p className="text-sm text-muted-foreground">Optional: Explain your choice</p>
        </div>
        <Textarea
          placeholder="Why did you allocate your savings this way?"
          value={explanation}
          onChange={(e) => onExplanationChange(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
    </div>
  )
}
