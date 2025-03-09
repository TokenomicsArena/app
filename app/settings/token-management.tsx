"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Trash2, Upload, Plus, EyeOff, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

type TokenManagementProps = {
  onEditToken: (token: Cryptocurrency) => void
  onDeleteToken: (token: Cryptocurrency) => void
  onAddToken: () => void
}

export default function TokenManagement({ 
  onEditToken, 
  onDeleteToken, 
  onAddToken 
}: TokenManagementProps) {
  // Get tokens and denylist from the store
  const { 
    tokens,
    deniedTokens,
    toggleDenyToken,
  } = useStore()
  
  // State for file upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  
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
        
        // Pass the validated tokens to the parent component
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tokensUploaded', { 
            detail: { tokens: validatedTokens } 
          }));
        }
        
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
  
  // Toggle token denylist status
  const toggleDenylist = (tokenId: string) => {
    toggleDenyToken(tokenId);
    
    const isDenied = deniedTokens.includes(tokenId);
    const token = tokens.find(t => t.id === tokenId);
    
    toast({
      title: isDenied ? "Token denied" : "Token allowed",
      description: `${token?.name} has been ${isDenied ? "added to" : "removed from"} the denylist`,
    });
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Token Management</CardTitle>
        <CardDescription>
          Manage the tokens available for comparison in the arena
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <Button 
            onClick={onAddToken} 
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            <span>Add Token</span>
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
            >
              <Upload className="h-4 w-4" />
              <span>Upload JSON</span>
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
            <TableHeader className="hidden sm:table-header-group">
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
                <TableRow 
                  key={token.id}
                  className={deniedTokens.includes(token.id) ? "opacity-60 bg-muted/50" : ""}
                >
                  <TableCell>
                    <div className="relative">
                      <Image
                        src={token.logo}
                        alt={token.name}
                        width={40}
                        height={40}
                        className={`rounded-full ${deniedTokens.includes(token.id) ? "grayscale" : ""}`}
                      />
                      {deniedTokens.includes(token.id) && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                          <EyeOff className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col sm:hidden">
                      <span>{token.name}</span>
                      <span className="text-xs text-muted-foreground">{token.symbol} - ${token.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{token.marketCap ? formatMarketCap(token.marketCap) : "N/A"}</span>
                    </div>
                    <span className="hidden sm:inline">{token.name}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{token.symbol}</TableCell>
                  <TableCell className="hidden sm:table-cell">${token.price.toLocaleString()}</TableCell>
                  <TableCell className="hidden sm:table-cell">{token.marketCap ? formatMarketCap(token.marketCap) : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDenylist(token.id)}
                        className={`${deniedTokens.includes(token.id) ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                      >
                        {deniedTokens.includes(token.id) ? (
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            Allow
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-4 w-4" />
                            Deny
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditToken(token)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteToken(token)}
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
  )
}
