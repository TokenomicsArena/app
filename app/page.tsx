"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import TokenSelection from "@/components/token-selection"
import { Cryptocurrency, getSmartPair, useStore } from "@/lib/store"
import AboutPage from "./about/page"

export default function Home() {
  const { history, addToHistory, updateHistory, toggleDenyToken, deniedTokens } = useStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Track how many times each token has been ignored (persisted in localStorage)
  const [ignoredTokenCounts, setIgnoredTokenCounts] = useState<Record<string, number>>({})
  
  // Load ignored token counts from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCounts = localStorage.getItem('ignoredTokenCounts');
      if (savedCounts) {
        try {
          setIgnoredTokenCounts(JSON.parse(savedCounts));
        } catch (e) {
          console.error('Error parsing ignored token counts from localStorage:', e);
        }
      }
    }
  }, []);
  
  // Save ignored token counts to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(ignoredTokenCounts).length > 0) {
      localStorage.setItem('ignoredTokenCounts', JSON.stringify(ignoredTokenCounts));
    }
  }, [ignoredTokenCounts]);

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
        const smartPair = await getSmartPair()
        setCryptoPair(smartPair)
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
    if (editId && !editProcessed.current && !isSubmitting) {
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

        // Check if we've reached a multiple of 10 selections
        if (history.length > 0 && history.length % 10 === 0) {
          toast({
            title: "Portfolio Suggestion",
            description: (
              <div>
                You've made {history.length} selections!
                Would you like to
                <a href="/portfolio" className="ml-1 text-primary hover:underline">
                  check out how your
                  current portfolio
                </a> &nbsp;

                is looking like?
              </div>
            ),
            duration: 3000,
          })
        }
      }

      // Reset for next pair using the smart selection
      const nextPair = await getSmartPair()
      setCryptoPair(nextPair)
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
      setCryptoPair(nextPair)

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
      const randomPair = await getSmartPair()

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
    // Check if the token is already in the denylist
    const isTokenDenied = deniedTokens.includes(id);
    
    // Only show notification and increment counter if the token is being added to the denylist
    if (!isTokenDenied) {
      // Get the token name from the current pair
      const tokenName = cryptoPair?.find(token => token.id === id)?.name || "Token";
      
      // Increment the counter for this token
      const currentCount = ignoredTokenCounts[id] || 0;
      const newCount = currentCount + 1;
      setIgnoredTokenCounts(prev => ({ ...prev, [id]: newCount }));
      
      // Show toast notification for the first three times
      if (newCount <= 3) {
        toast({
          title: `${tokenName} ignored`,
          description: (
            <div>
              This token won't appear in future comparisons. You can 
              <Link href="/settings" className="ml-1 text-primary hover:underline">
                go to your settings
              </Link> to re-allow it.
            </div>
          ),
          duration: 4000,
        });
      }
    }
    
    // Toggle the token in the denylist
    toggleDenyToken(id);

    setIsLoading(true)
    try {
      // Get a new pair after denying
      const nextPair = await getSmartPair();
      if (nextPair === null) {
        // If both smart and random selection fail, show a message
        toast({
          title: "All combinations completed!",
          description: "You've seen all possible token combinations.",
        });
        // Redirect to history page
        router.push('/history');
      } else {
        setCryptoPair(nextPair);
        setAllocation([50]); // Reset allocation to 50/50
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

  return !cryptoPair ? <AboutPage /> : <main className="container max-w-4xl mx-auto py-8 px-4">
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
}
