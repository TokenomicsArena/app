"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import TokenSelection from "@/components/token-selection"
import { Cryptocurrency, getRandomPair, getSmartPair, useStore } from "@/lib/store"
import Link from "next/link"

export default function Home() {
  const { history, addToHistory, updateHistory, toggleDenyToken } = useStore()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize with null to prevent hydration issues
  const [cryptoPair, setCryptoPair] = useState<[Cryptocurrency, Cryptocurrency] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Initialize the token pair on the client side only
  useEffect(() => {
    // Check if we're editing an existing item first
    const editId = searchParams.get("edit")
    
    if (editId) {
      // If we're editing, the other useEffect will handle loading the pair
      setIsLoading(false)
      return;
    }
    
    // Define an async function to load the pair
    const loadPair = async () => {
      setIsLoading(true)
      try {
        // Only load a random pair if we're not editing
        // Try to get a smart pair first
        const smartPair = await getSmartPair()
        
        // If all pairs have been exhausted or it's the first load, try random pair
        if (smartPair === null) {
          const randomPair = await getRandomPair()
          
          if (randomPair === null) {
            // If both smart and random selection fail, show a message
            toast({
              title: "All combinations completed!",
              description: "You've seen all possible token combinations.",
              variant: "destructive"
            })
            
            // Redirect to history page
            router.push('/history')
          } else {
            setCryptoPair(randomPair)
          }
        } else {
          setCryptoPair(smartPair)
        }
      } catch (error) {
        console.error("Error loading token pair:", error)
        toast({
          title: "Error loading tokens",
          description: "There was a problem loading the token pair. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPair()
  }, [router, searchParams])
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

  const handleSubmit = async () => {
    // Don't proceed if cryptoPair is null
    if (!cryptoPair) return
    
    setIsSubmitting(true)

    let finalCrypto1, finalCrypto2, crypto1AllocationPercent;
    
    if (editingId) {
      // When editing, preserve the original token order
      finalCrypto1 = cryptoPair[0];
      finalCrypto2 = cryptoPair[1];
      crypto1AllocationPercent = 100 - allocation[0];
    } else {
      // For new submissions, determine if we need to swap tokens based on allocation
      // If allocation > 50%, the second token has higher allocation
      // and should become the first token
      finalCrypto1 = cryptoPair[0];
      finalCrypto2 = cryptoPair[1];
      crypto1AllocationPercent = 100 - allocation[0];

      // If second token has higher allocation, swap them
      if (allocation[0] > 50) {
        finalCrypto1 = cryptoPair[1];
        finalCrypto2 = cryptoPair[0];
        crypto1AllocationPercent = allocation[0];
      }
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

    try {
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
      const nextPair = await getSmartPair()
      
      // If all pairs have been exhausted, try random pair
      if (nextPair === null) {
        const randomPair = await getRandomPair()
        
        if (randomPair === null) {
          // If both smart and random selection fail, show a message
          toast({
            title: "All combinations completed!",
            description: "You've seen all possible token combinations.",
          })
          
          // Redirect to history page
          router.push('/history')
        } else {
          setCryptoPair(randomPair)
          
          toast({
            title: "New random pair!",
            description: "Using random selection as all smart pairs are exhausted.",
          })
        }
      } else {
        setCryptoPair(nextPair)
      }
      
      setAllocation([50])
      setExplanation("")
      setEditingId(null)
    } catch (error) {
      console.error("Error submitting selection:", error)
      toast({
        title: "Error submitting",
        description: "There was a problem submitting your selection. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    // Reset the processed flag when canceling
    editProcessed.current = false
    setEditingId(null)
    
    setIsLoading(true)
    try {
      // Get next pair using smart selection
      const nextPair = await getSmartPair()
      
      // If all pairs have been exhausted, try random pair
      if (nextPair === null) {
        const randomPair = await getRandomPair()
        
        if (randomPair === null) {
          // If both smart and random selection fail, show a message
          toast({
            title: "All combinations completed!",
            description: "You've seen all possible token combinations.",
          })
          
          // Redirect to history page
          router.push('/history')
          return
        } else {
          setCryptoPair(randomPair)
          
          toast({
            title: "New random pair!",
            description: "Using random selection as all smart pairs are exhausted.",
          })
        }
      } else {
        setCryptoPair(nextPair)
      }
      
      setAllocation([50])
      setExplanation("")
      router.push("/")
    } catch (error) {
      console.error("Error canceling edit:", error)
      toast({
        title: "Error loading tokens",
        description: "There was a problem loading the next token pair. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRandomize = async () => {
    setIsLoading(true)
    try {
      // Get a completely random pair
      const randomPair = await getRandomPair()
      
      if (randomPair === null) {
        toast({
          title: "All combinations completed!",
          description: "You've seen all possible token combinations.",
          variant: "destructive"
        })
        return
      }
      
      setCryptoPair(randomPair)
      setAllocation([50]) // Reset allocation to 50/50
      
      toast({
        title: "Randomized!",
        description: `New pair: ${randomPair[0].name} vs ${randomPair[1].name}`,
      })
    } catch (error) {
      console.error("Error randomizing pair:", error)
      toast({
        title: "Error randomizing",
        description: "There was a problem getting a random token pair. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle denying a token
  const handleDenyToken = async (id: string) => {
    toggleDenyToken(id);
    
    setIsLoading(true)
    try {
      // Get a new pair after denying
      const nextPair = await getSmartPair();
      
      // If all pairs have been exhausted, try random pair
      if (nextPair === null) {
        const randomPair = await getRandomPair();
        
        if (randomPair === null) {
          // If both smart and random selection fail, show a message
          toast({
            title: "All combinations completed!",
            description: "You've seen all possible token combinations.",
          });
          
          // Redirect to history page
          router.push('/history');
        } else {
          setCryptoPair(randomPair);
          setAllocation([50]); // Reset allocation to 50/50
          
          toast({
            title: "Token denied",
            description: "This token won't appear in future selections. Using random selection.",
          });
        }
      } else {
        setCryptoPair(nextPair);
        setAllocation([50]); // Reset allocation to 50/50
        
        toast({
            title: "Token denied",
            description: "This token won't appear in future selections.",
        });
      }
    } catch (error) {
      console.error("Error denying token:", error)
      toast({
        title: "Error denying token",
        description: "There was a problem updating the token list. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <noscript>
        <div className="py-8">
          <h2 className="text-2xl font-bold mb-4">JavaScript Required</h2>
          <p className="mb-4">This application requires JavaScript to function properly.</p>
          <p>Please enable JavaScript in your browser settings and reload the page.</p>
        </div>
      </noscript>
      <h1 className="text-3xl font-bold text-center mb-8">{editingId ? "Edit Your Selection" : "Tokenomics Arena"}</h1>

      <TokenSelection
        cryptoPair={cryptoPair}
        allocation={allocation}
        explanation={explanation}
        onAllocationChange={setAllocation}
        onExplanationChange={setExplanation}
        onDenylistToken={handleDenyToken}
        onSubmit={handleSubmit}
        onRandomize={!editingId ? handleRandomize : undefined}
        isSubmitting={isSubmitting}
        isEditing={!!editingId}
      />

      {editingId && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={handleCancel} className="w-full max-w-xs">
            Cancel
          </Button>
        </div>
      )}
    </main>
  )
}
