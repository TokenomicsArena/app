"use client"

import { AlertTriangle } from "lucide-react"

import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useStore, cryptocurrencies as defaultCryptocurrencies } from "@/lib/store"

// Define the cryptocurrency type
type Cryptocurrency = {
  id: string
  name: string
  symbol: string
  logo: string
  price: number
  marketCap?: number
}

type DeleteTokenDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tokenToDelete: Cryptocurrency | null
  setTokenToDelete: (token: Cryptocurrency | null) => void
}

export default function DeleteTokenDialog({ 
  isOpen, 
  onOpenChange, 
  tokenToDelete, 
  setTokenToDelete 
}: DeleteTokenDialogProps) {
  const { tokens, deleteToken, resetTokensToDefault } = useStore()
  
  // Confirm token delete
  const confirmDeleteToken = () => {
    if (!tokenToDelete) return
    
    // Special case for resetting to default tokens
    if (tokenToDelete.id === "ALL_TOKENS") {
      // Reset tokens to default
      resetTokensToDefault()
      
      toast({
        title: "Tokens reset",
        description: "Successfully reset to default tokens",
      })
    } else {
      // Delete the token from the store
      deleteToken(tokenToDelete.id)
      
      toast({
        title: "Token deleted",
        description: `Successfully deleted ${tokenToDelete.name} and removed related history entries`,
      })
    }
    
    onOpenChange(false)
    setTokenToDelete(null)
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {tokenToDelete?.id === "ALL_TOKENS" ? "Reset to Default Tokens?" : "Delete Token?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tokenToDelete?.id === "ALL_TOKENS" ? (
              <>
                This will reset your token list to the default {defaultCryptocurrencies.length} tokens.
                Any custom tokens you've added ({tokens.length - defaultCryptocurrencies.length > 0 ? tokens.length - defaultCryptocurrencies.length : 0} tokens) will be permanently deleted.
                History entries for deleted tokens will also be removed.
              </>
            ) : (
              <>
                This will permanently delete the token "{tokenToDelete?.name}" and remove all related history entries.
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {tokenToDelete?.id === "ALL_TOKENS" && (
          <div className="py-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive mb-2">The following tokens will be removed:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {tokens.filter(t => !defaultCryptocurrencies.some(dt => dt.id === t.id)).length > 0 ? (
                  tokens.filter(t => !defaultCryptocurrencies.some(dt => dt.id === t.id)).map(token => (
                    <li key={token.id}>{token.name} ({token.symbol})</li>
                  ))
                ) : (
                  <li>No custom tokens to remove</li>
                )}
              </ul>
            </div>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTokenToDelete(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteToken}
            className="bg-destructive text-destructive-foreground"
          >
            {tokenToDelete?.id === "ALL_TOKENS" ? "Reset Tokens" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
