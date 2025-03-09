"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Trash2, Upload, Save, Plus, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

export default function SettingsPage() {
  const { history, exportHistory } = useStore()
  
  // Get tokens from the store
  const { tokens, setTokens, updateToken, addToken, deleteToken, resetTokensToDefault, clearHistory } = useStore()
  
  // State for token editing
  const [editingToken, setEditingToken] = useState<Cryptocurrency | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // State for token deletion
  const [tokenToDelete, setTokenToDelete] = useState<Cryptocurrency | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // State for file upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedTokens, setUploadedTokens] = useState<Cryptocurrency[] | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  
  // State for danger zone
  const [resetConfirmText, setResetConfirmText] = useState("")
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const RESET_CONFIRMATION_TEXT = "DELETE ALL HISTORY"
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // Validate the data structure
        if (!Array.isArray(data)) {
          throw new Error("Invalid JSON format: Expected an array")
        }
        
        // Validate each token
        const validatedTokens = data.map((token: any) => {
          if (!token.id || !token.name || !token.symbol || !token.logo || token.price === undefined) {
            throw new Error(`Invalid token data: ${JSON.stringify(token)}`)
          }
          
          return {
            id: token.id,
            name: token.name,
            symbol: token.symbol,
            logo: token.logo,
            price: token.price,
            marketCap: token.marketCap || 0,
          }
        })
        
        setUploadedTokens(validatedTokens)
        setIsUploadDialogOpen(true)
        
        toast({
          title: "File uploaded",
          description: `Successfully parsed ${validatedTokens.length} tokens`,
        })
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
        // Reset the file input
        if (event.target) {
          event.target.value = ""
        }
      }
    }
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Could not read the uploaded file",
        variant: "destructive",
      })
      setIsUploading(false)
    }
    
    reader.readAsText(file)
  }
  
  // Handle token edit
  const handleEditToken = (token: Cryptocurrency) => {
    setEditingToken({ ...token })
    setIsEditDialogOpen(true)
  }
  
  // Handle token save
  const handleSaveToken = () => {
    if (!editingToken) return
    
    // Update the token in the store
    updateToken(editingToken)
    
    toast({
      title: "Token updated",
      description: `Successfully updated ${editingToken.name}`,
    })
    
    setIsEditDialogOpen(false)
    setEditingToken(null)
  }
  
  // Handle token delete
  const handleDeleteToken = (token: Cryptocurrency) => {
    setTokenToDelete(token)
    setIsDeleteDialogOpen(true)
  }
  
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
    
    setIsDeleteDialogOpen(false)
    setTokenToDelete(null)
  }
  
  // Handle add new token
  const handleAddToken = () => {
    const newToken: Cryptocurrency = {
      id: `new-token-${Date.now()}`,
      name: "New Token",
      symbol: "NEW",
      logo: "/placeholder.svg?height=80&width=80",
      price: 0,
      marketCap: 0,
    }
    
    setEditingToken(newToken)
    setIsEditDialogOpen(true)
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
    
    setIsEditDialogOpen(false)
    setEditingToken(null)
  }
  
  // Handle apply uploaded tokens
  const handleApplyUploadedTokens = () => {
    if (!uploadedTokens) return
    
    // Update the tokens in the store
    setTokens(uploadedTokens)
    
    toast({
      title: "Tokens updated",
      description: `Successfully updated token list with ${uploadedTokens.length} tokens`,
    })
    
    setIsUploadDialogOpen(false)
    setUploadedTokens(null)
  }
  
  // Handle reset history
  const handleResetHistory = () => {
    setIsResetDialogOpen(true)
  }
  
  // Confirm reset history
  const confirmResetHistory = () => {
    if (resetConfirmText !== RESET_CONFIRMATION_TEXT) return
    
    // Clear the history in the store
    clearHistory()
    
    toast({
      title: "History reset",
      description: "Successfully cleared all history",
    })
    
    setIsResetDialogOpen(false)
    setResetConfirmText("")
  }
  
  // Format market cap for display
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`
    } else {
      return `$${marketCap.toLocaleString()}`
    }
  }
  
  return (
    <main className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Token Management</CardTitle>
          <CardDescription>
            Manage the tokens available for comparison in the arena
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Button onClick={handleAddToken} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Token
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload JSON
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/json"
                className="hidden"
              />
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <Image
                        src={token.logo}
                        alt={token.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>{token.symbol}</TableCell>
                    <TableCell>${token.price.toLocaleString()}</TableCell>
                    <TableCell>{token.marketCap ? formatMarketCap(token.marketCap) : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditToken(token)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteToken(token)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card className="border-destructive">
        <CardHeader className="bg-destructive/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            These actions are destructive and cannot be undone. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Backup section - safety first */}
            <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 rounded-md p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Save className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2 text-amber-700 dark:text-amber-400">Backup Your Data</h3>
                  <p className="text-amber-700 dark:text-amber-400 mb-4 text-sm">
                    Before performing any destructive actions, consider exporting your data as a backup.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60"
                      onClick={() => {
                        const data = exportHistory();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `tokenomics-history-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast({
                          title: "History exported",
                          description: "Your history has been exported successfully",
                        });
                      }}
                    >
                      Export History
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60"
                      onClick={() => {
                        const data = JSON.stringify(tokens, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `tokenomics-tokens-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast({
                          title: "Tokens exported",
                          description: "Your token list has been exported successfully",
                        });
                      }}
                    >
                      Export Tokens
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* History reset section */}
            <div className="border border-destructive/30 bg-destructive/5 rounded-md p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-destructive/10 rounded-full">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    Reset All History
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-normal">
                      {history.length} entries
                    </span>
                  </h3>
                  <p className="text-muted-foreground mb-2 text-sm">
                    This will permanently delete all your selection history and preferences. 
                    Your token allocation preferences and comparison data will be lost.
                  </p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground mb-4 space-y-1">
                    <li>All token comparison history will be erased</li>
                    <li>Token preference data will be reset</li>
                    <li>Smart selection algorithm will start from scratch</li>
                  </ul>
                  <Button 
                    variant="destructive" 
                    onClick={handleResetHistory}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Reset History
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Token reset section */}
            <div className="border border-destructive/30 bg-destructive/5 rounded-md p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    Reset to Default Tokens
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-normal">
                      {tokens.length} tokens
                    </span>
                  </h3>
                  <p className="text-muted-foreground mb-2 text-sm">
                    This will reset the token list to the default {defaultCryptocurrencies.length} tokens. 
                    Any custom tokens you've added will be permanently removed.
                  </p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground mb-4 space-y-1">
                    <li>All custom tokens will be deleted</li>
                    <li>Token list will revert to the original {defaultCryptocurrencies.length} default tokens</li>
                    <li>History entries for deleted tokens will also be removed</li>
                  </ul>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      // Create a confirmation dialog
                      setIsDeleteDialogOpen(true);
                      setTokenToDelete({
                        id: "ALL_TOKENS",
                        name: "All Custom Tokens",
                        symbol: "",
                        logo: "",
                        price: 0
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Token Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                editingToken && tokens.some(t => t.id === editingToken.id)
                  ? handleSaveToken
                  : saveNewToken
              }
              className="flex items-center gap-2"
            >
              {editingToken && tokens.some(t => t.id === editingToken.id) ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    <path d="m15 5 4 4"></path>
                  </svg>
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Token Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
      
      {/* Upload Tokens Dialog */}
      <AlertDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
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
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset History Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Reset All History?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your selection history ({history.length} entries).
              Your token allocation preferences and comparison data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 mb-4 text-sm">
              <p className="font-medium text-destructive mb-2">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Delete all {history.length} history entries</li>
                <li>Reset all token preference data</li>
                <li>Cause the smart selection algorithm to start from scratch</li>
                <li>Remove all your token allocation preferences</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                To confirm, type "{RESET_CONFIRMATION_TEXT}" in the field below:
              </p>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder={RESET_CONFIRMATION_TEXT}
                className="border-destructive"
              />
              {resetConfirmText !== "" && resetConfirmText !== RESET_CONFIRMATION_TEXT && (
                <p className="text-xs text-destructive">
                  Text doesn't match. Please type exactly "{RESET_CONFIRMATION_TEXT}".
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetHistory}
              disabled={resetConfirmText !== RESET_CONFIRMATION_TEXT}
              className="bg-destructive text-destructive-foreground flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Reset All History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
