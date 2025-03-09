"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import TokenSelection from "@/components/token-selection"
import { getRandomPair, getSmartPair, useStore } from "@/lib/store"
import AboutPage from "./about/page"
import Link from "next/link"

export default function Home() {
  const { history, addToHistory, updateHistory } = useStore()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize with null to prevent hydration issues
  const [cryptoPair, setCryptoPair] = useState<ReturnType<typeof getRandomPair> | null>(null)
  
  // Initialize the token pair on the client side only
  useEffect(() => {
    // Try to get a smart pair first
    const smartPair = getSmartPair()
    
    // If all pairs have been exhausted or it's the first load, use random pair
    if (smartPair === null) {
      setCryptoPair(getRandomPair())
    } else {
      setCryptoPair(smartPair)
    }
  }, [])
  const [allocation, setAllocation] = useState([50])
  const [explanation, setExplanation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Use a ref to track if we've already processed the edit parameter
  const editProcessed = useRef(false)

  // Check for edit parameter in URL and load the corresponding history item
  useEffect(() => {
    const editId = searchParams.get("edit")

    // Only process if we have an edit ID and haven't processed it yet
    if (editId && !editProcessed.current) {
      const itemToEdit = history.find((item) => item.id === editId)

      if (itemToEdit) {
        // Set all state at once to avoid multiple re-renders
        // Note: We keep the original order from the history item
        setCryptoPair([itemToEdit.crypto1, itemToEdit.crypto2])
        // Convert crypto1AllocationPercent to slider value (which represents crypto2's allocation)
        setAllocation([100 - itemToEdit.crypto1AllocationPercent])
        setExplanation(itemToEdit.explanation)
        setEditingId(editId)

        toast({
          title: "Editing selection",
          description: `Editing your allocation between ${itemToEdit.crypto1.name} and ${itemToEdit.crypto2.name}`,
        })
      } else {
        toast({
          title: "Item not found",
          description: "The selection you're trying to edit could not be found",
          variant: "destructive",
        })
      }

      // Mark as processed to prevent further processing
      editProcessed.current = true
    }
  }, [searchParams, history]) // Only depend on searchParams and history

  const handleSubmit = () => {
    // Don't proceed if cryptoPair is null
    if (!cryptoPair) return
    
    setIsSubmitting(true)

    // Determine if we need to swap tokens based on allocation
    // If allocation > 50%, the second token has higher allocation
    // and should become the first token
    let finalCrypto1 = cryptoPair[0]
    let finalCrypto2 = cryptoPair[1]
    let crypto1AllocationPercent = 100 - allocation[0]

    // If second token has higher allocation, swap them
    if (allocation[0] > 50) {
      finalCrypto1 = cryptoPair[1]
      finalCrypto2 = cryptoPair[0]
      crypto1AllocationPercent = allocation[0]
    }

    // Create history item with potentially swapped tokens
    const historyItem = {
      id: editingId || Date.now().toString(),
      timestamp: new Date(),
      crypto1: finalCrypto1,
      crypto2: finalCrypto2,
      crypto1AllocationPercent: crypto1AllocationPercent,
      explanation: explanation,
    }

    // Simulate API call
    setTimeout(() => {
      if (editingId) {
        // Update existing item
        updateHistory(editingId, historyItem)

        toast({
          title: "Selection updated!",
          description: `You updated your allocation between ${finalCrypto1.name} and ${finalCrypto2.name}`,
        })

        // Reset the processed flag when we're done editing
        editProcessed.current = false

        router.push("/history")
      } else {
        // Add new item
        addToHistory(historyItem)

        toast({
          title: "Choice submitted!",
          description: `You allocated ${crypto1AllocationPercent}% to ${finalCrypto1.name} and ${100 - crypto1AllocationPercent}% to ${finalCrypto2.name}`,
        })
      }

      // Reset for next pair using the smart selection
      const nextPair = getSmartPair()
      
      // If all pairs have been exhausted, show a message and use random pair
      if (nextPair === null) {
        toast({
          title: "All combinations completed!",
          description: "You've seen all possible token combinations.",
        })
        
        router.push('/history')
      } else {
        setCryptoPair(nextPair)
      }
      setAllocation([50])
      setExplanation("")
      setIsSubmitting(false)
      setEditingId(null)
    }, 1000)
  }

  const handleCancel = () => {
    // Reset the processed flag when canceling
    editProcessed.current = false
    setEditingId(null)
    
    // Get next pair using smart selection
    const nextPair = getSmartPair()
    
    // If all pairs have been exhausted, show a message and redirect to history
    if (nextPair === null) {
      toast({
        title: "All combinations completed!",
        description: "You've seen all possible token combinations.",
      })
      
      router.push('/history')
      return
    }
    
    setCryptoPair(nextPair)
    setAllocation([50])
    setExplanation("")
    router.push("/")
  }

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <noscript>
        <AboutPage />
      </noscript>
      <h1 className="text-3xl font-bold text-center mb-8">{editingId ? "Edit Your Selection" : "Tokenomics Arena"}</h1>

      <TokenSelection
        cryptoPair={cryptoPair}
        allocation={allocation}
        explanation={explanation}
        onAllocationChange={setAllocation}
        onExplanationChange={setExplanation}
      />

      <div className="flex gap-4">
        {editingId && (
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
        )}

        <Button onClick={handleSubmit} disabled={isSubmitting} className={editingId ? "flex-1" : "w-full"} size="lg">
          {isSubmitting ? "Submitting..." : editingId ? "Update Selection" : "Submit & Get Next Pair"}
          {!isSubmitting && !editingId && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </main>
  )
}
