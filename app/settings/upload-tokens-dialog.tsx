"use client"

import { Upload } from "lucide-react"

import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { useStore } from "@/lib/store"

// Define the cryptocurrency type
type Cryptocurrency = {
  id: string
  name: string
  symbol: string
  logo: string
  price: number
  marketCap?: number
}

type UploadTokensDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  uploadedTokens: Cryptocurrency[] | null
  setUploadedTokens: (tokens: Cryptocurrency[] | null) => void
}

export default function UploadTokensDialog({ 
  isOpen, 
  onOpenChange, 
  uploadedTokens, 
  setUploadedTokens 
}: UploadTokensDialogProps) {
  const { tokens, setTokens } = useStore()
  
  // Handle apply uploaded tokens
  const handleApplyUploadedTokens = () => {
    if (!uploadedTokens) return
    
    // Update the tokens in the store
    setTokens(uploadedTokens)
    
    toast({
      title: "Tokens updated",
      description: `Successfully updated token list with ${uploadedTokens.length} tokens`,
    })
    
    onOpenChange(false)
    setUploadedTokens(null)
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Apply Uploaded Tokens?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will replace your current token list with the uploaded tokens.
            You have {tokens.length} current tokens and are about to replace them with {uploadedTokens?.length} new tokens.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 mb-4 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400 mb-2">Important information:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400">
              <li>Your current token list will be completely replaced</li>
              <li>Any custom tokens not in the uploaded list will be lost</li>
              <li>History entries for tokens not in the new list will be removed</li>
              <li>This action cannot be undone (consider exporting your current tokens first)</li>
            </ul>
          </div>
          
          <div className="max-h-[200px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedTokens?.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>{token.symbol}</TableCell>
                    <TableCell>${token.price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setUploadedTokens(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleApplyUploadedTokens}
            className="flex items-center gap-2 justify-center"
          >
            <Upload className="h-4 w-4" />
            <span>Apply Changes</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
