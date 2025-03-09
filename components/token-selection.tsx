"use client"
import Image from "next/image"
import { Info, X } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

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
  onDenylistToken?: (id: string) => void // TODO: Rename to onDenyToken in a future update
  onSubmit?: () => void
  onRandomize?: () => void
  isSubmitting?: boolean
  isEditing?: boolean
}

export default function TokenSelection({
  cryptoPair,
  allocation,
  explanation,
  onAllocationChange,
  onExplanationChange,
  onDenylistToken,
  onSubmit,
  onRandomize,
  isSubmitting = false,
  isEditing = false,
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
          <Card key={crypto.id} className={`border-2 ${index === 0 ? "border-blue-500" : "border-red-500"} relative`}>
            {onDenylistToken && (
              <button 
                onClick={() => onDenylistToken(crypto.id)}
                className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                title="Never show this token again"
                aria-label="Deny token"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
        <div className="flex flex-row items-center justify-between mb-4 sm:mb-2 gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <p className="text-sm font-medium">100% {cryptoPair[0].name}</p>
          </div>

          <p className="text-sm font-medium">50%</p>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <p className="text-sm font-medium">100% {cryptoPair[1].name}</p>
          </div>
        </div>

        <Slider
          value={allocation}
          onValueChange={onAllocationChange}
          max={100}
          min={0}
          step={0.01}
          className="mb-6"
          thumbClassName="h-8 w-8 border-2" // Increased thumb size for better touch targets
          trackClassName="h-4" // Slightly taller track for easier interaction
        />
      </div>

      {/* Action Buttons */}
      {(onSubmit || onRandomize) && (
        <div className="flex flex-col gap-4 mb-8">
          {onSubmit && (
            <Button 
              onClick={onSubmit} 
              disabled={isSubmitting} 
              size="lg"
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : isEditing ? "Update Selection" : "Save & Continue"}
              {!isSubmitting && !isEditing && <span className="ml-2">→</span>}
            </Button>
          )}
          
          {onRandomize && !isEditing && (
            <Button 
              variant="outline" 
              onClick={onRandomize} 
              size="lg"
              className="w-full"
            >
              Randomize
            </Button>
          )}
        </div>
      )}

      {/* Optional Explanation */}
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
