"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type EditTokenDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingToken: Cryptocurrency | null
  setEditingToken: (token: Cryptocurrency | null) => void
}

export default function EditTokenDialog({ 
  isOpen, 
  onOpenChange, 
  editingToken, 
  setEditingToken 
}: EditTokenDialogProps) {
  const { tokens, updateToken, addToken } = useStore()
  
  // Handle token save
  const handleSaveToken = () => {
    if (!editingToken) return
    
    // Update the token in the store
    updateToken(editingToken)
    
    toast({
      title: "Token updated",
      description: `Successfully updated ${editingToken.name}`,
    })
    
    onOpenChange(false)
    setEditingToken(null)
  }
  
  // Save new token
  const saveNewToken = () => {
    if (!editingToken) return
    
    // Add the new token to the store
    addToken(editingToken)
    
    toast({
      title: "Token added",
      description: `Successfully added ${editingToken.name}`,
    })
    
    onOpenChange(false)
    setEditingToken(null)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingToken && tokens.some(t => t.id === editingToken.id) ? (
              <>
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    <path d="m15 5 4 4"></path>
                  </svg>
                </div>
                Edit {editingToken?.name}
              </>
            ) : (
              <>
                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Add New Token
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingToken && tokens.some(t => t.id === editingToken.id)
              ? "Update the token information below."
              : "Enter the details for the new token below."}
          </DialogDescription>
        </DialogHeader>
        
        {editingToken && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="token-name" className="text-right">
                Name
              </Label>
              <Input
                id="token-name"
                value={editingToken.name}
                onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })}
                className="col-span-3"
                placeholder="Bitcoin"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="token-symbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="token-symbol"
                value={editingToken.symbol}
                onChange={(e) => setEditingToken({ ...editingToken, symbol: e.target.value })}
                className="col-span-3"
                placeholder="BTC"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="token-price" className="text-right">
                Price ($)
              </Label>
              <Input
                id="token-price"
                type="number"
                value={editingToken.price}
                onChange={(e) => setEditingToken({ ...editingToken, price: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
                placeholder="65000"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="token-marketcap" className="text-right">
                Market Cap ($)
              </Label>
              <Input
                id="token-marketcap"
                type="number"
                value={editingToken.marketCap || 0}
                onChange={(e) => setEditingToken({ ...editingToken, marketCap: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
                placeholder="1200000000000"
                min="0"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="token-logo" className="text-right">
                Logo URL
              </Label>
              <Input
                id="token-logo"
                value={editingToken.logo}
                onChange={(e) => setEditingToken({ ...editingToken, logo: e.target.value })}
                className="col-span-3"
                placeholder="/placeholder.svg?height=80&width=80"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">Preview</div>
              <div className="col-span-3 flex items-center gap-4">
                <div className="border rounded-full p-1 bg-background">
                  <Image
                    src={editingToken.logo}
                    alt={editingToken.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {editingToken.name} ({editingToken.symbol}) - ${editingToken.price.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={
              editingToken && tokens.some(t => t.id === editingToken.id)
                ? handleSaveToken
                : saveNewToken
            }
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {editingToken && tokens.some(t => t.id === editingToken.id) ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                  <path d="m15 5 4 4"></path>
                </svg>
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add Token</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
