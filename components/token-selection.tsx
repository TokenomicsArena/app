"use client"
import Image from "next/image"
import { 
  Info, 
  X, 
  Globe, 
  FileText, 
  Twitter, 
  MessageSquare, 
  Github, 
  ExternalLink,
  Facebook,
  MessageCircle,
  Search,
  BookOpen,
  Bell
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type TokenSelectionProps = {
  cryptoPair: Array<{
    id: string
    name: string
    symbol: string
    logo: string
    urls?: {
      website?: string[]
      technical_doc?: string[]
      twitter?: string[]
      reddit?: string[]
      message_board?: string[]
      source_code?: string[]
      chat?: string[]
      facebook?: string[]
      explorer?: string[]
      announcement?: string[]
    }
    description?: string
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

// Helper component for URL icons with hover effect and tooltip
const UrlIcon = ({ url, icon: Icon, label }: { url: string, icon: any, label: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-full hover:bg-accent"
        >
          <Icon className="h-4 w-4" />
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

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
  const isMobile = useIsMobile()

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

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cryptoPair.map((crypto, index) => (
          <Card 
            key={crypto.id} 
            className={`border-2 ${index === 0 ? "border-blue-500" : "border-red-500"} relative`}
          >
            {/* Info Button */}
            {crypto.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="absolute top-2 left-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[300px]">
                    <p className="text-sm">{crypto.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Deny Button */}
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
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'} flex flex-col items-center`}>
              <Image
                src={crypto.logo || "/placeholder.svg"}
                alt={crypto.name}
                width={isMobile ? 60 : 80}
                height={isMobile ? 60 : 80}
                className={`${isMobile ? 'mb-2' : 'mb-4'}`}
              />
              <h2 className="text-2xl font-bold">{crypto.name}</h2>
              <p className="text-xl text-muted-foreground">{crypto.symbol}</p>
              <div className={`mt-2 ${isMobile ? 'text-sm' : 'text-2xl'} font-bold`}>
                {index === 0 ? (100 - allocation[0]).toFixed(2) : allocation[0].toFixed(2)}%
              </div>
              
              {/* URL Icons */}
              {crypto.urls && (
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {crypto.urls.website?.[0] && (
                    <UrlIcon url={crypto.urls.website[0]} icon={Globe} label="Website" />
                  )}
                  {crypto.urls.technical_doc?.[0] && (
                    <UrlIcon url={crypto.urls.technical_doc[0]} icon={FileText} label="Documentation" />
                  )}
                  {crypto.urls.twitter?.[0] && (
                    <UrlIcon url={crypto.urls.twitter[0]} icon={Twitter} label="Twitter" />
                  )}
                  {crypto.urls.reddit?.[0] && (
                    <UrlIcon url={crypto.urls.reddit[0]} icon={MessageSquare} label="Reddit" />
                  )}
                  {crypto.urls.message_board?.[0] && (
                    <UrlIcon url={crypto.urls.message_board[0]} icon={MessageCircle} label="Forum" />
                  )}
                  {crypto.urls.source_code?.[0] && (
                    <UrlIcon url={crypto.urls.source_code[0]} icon={Github} label="Source Code" />
                  )}
                  {crypto.urls.chat?.[0] && (
                    <UrlIcon url={crypto.urls.chat[0]} icon={MessageSquare} label="Chat" />
                  )}
                  {crypto.urls.facebook?.[0] && (
                    <UrlIcon url={crypto.urls.facebook[0]} icon={Facebook} label="Facebook" />
                  )}
                  {crypto.urls.explorer?.[0] && (
                    <UrlIcon url={crypto.urls.explorer[0]} icon={Search} label="Explorer" />
                  )}
                  {crypto.urls.announcement?.[0] && (
                    <UrlIcon url={crypto.urls.announcement[0]} icon={Bell} label="Announcements" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex flex-row items-center justify-between mb-4 sm:mb-2 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <p className="text-sm font-medium">{cryptoPair[0].name}</p>
          </div>

          <p className="text-sm font-medium text-center flex-1 opacity-25">50%</p>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <p className="text-sm font-medium">{cryptoPair[1].name}</p>
          </div>
        </div>

        <Slider
          value={allocation}
          onValueChange={(value) => {
            onAllocationChange(value)
          }}
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
          onChange={(e) => {
            onExplanationChange(e.target.value)
          }}
          className="min-h-[100px]"
        />
      </div>
    </div>
  )
}
