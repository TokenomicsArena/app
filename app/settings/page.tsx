"use client"

import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

// Import components
import TokenManagement from "./token-management"
import DenylistManagement from "./denylist-management"
import DangerZone from "./danger-zone"
import EditTokenDialog from "./edit-token-dialog"
import DeleteTokenDialog from "./delete-token-dialog"
import UploadTokensDialog from "./upload-tokens-dialog"
import ResetHistoryDialog from "./reset-history-dialog"

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
  const isMobile = useIsMobile()
  
  // State for token editing
  const [editingToken, setEditingToken] = useState<Cryptocurrency | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // State for token deletion
  const [tokenToDelete, setTokenToDelete] = useState<Cryptocurrency | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // State for file upload
  const [uploadedTokens, setUploadedTokens] = useState<Cryptocurrency[] | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  
  // State for reset history
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  
  // Handle token edit
  const handleEditToken = (token: Cryptocurrency) => {
    setEditingToken({ ...token })
    setIsEditDialogOpen(true)
  }
  
  // Handle token delete
  const handleDeleteToken = (token: Cryptocurrency) => {
    setTokenToDelete(token)
    setIsDeleteDialogOpen(true)
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
  
  // Handle reset history
  const handleResetHistory = () => {
    setIsResetDialogOpen(true)
  }
  
  // Handle reset tokens
  const handleResetTokens = () => {
    setIsDeleteDialogOpen(true)
    setTokenToDelete({
      id: "ALL_TOKENS",
      name: "All Custom Tokens",
      symbol: "",
      logo: "",
      price: 0
    })
  }
  
  // Listen for token upload events
  useEffect(() => {
    const handleTokensUploaded = (event: any) => {
      if (event.detail && event.detail.tokens) {
        setUploadedTokens(event.detail.tokens)
        setIsUploadDialogOpen(true)
      }
    }
    
    window.addEventListener('tokensUploaded', handleTokensUploaded)
    
    return () => {
      window.removeEventListener('tokensUploaded', handleTokensUploaded)
    }
  }, [])
  
  return (
    <main className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* Token Management */}
      <TokenManagement 
        onEditToken={handleEditToken}
        onDeleteToken={handleDeleteToken}
        onAddToken={handleAddToken}
      />
      
      {/* Denylist Management */}
      <DenylistManagement />
      
      {/* Danger Zone */}
      <DangerZone 
        onResetHistory={handleResetHistory}
        onResetTokens={handleResetTokens}
      />
      
      {/* Edit Token Dialog */}
      <EditTokenDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingToken={editingToken}
        setEditingToken={setEditingToken}
      />
      
      {/* Delete Token Dialog */}
      <DeleteTokenDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        tokenToDelete={tokenToDelete}
        setTokenToDelete={setTokenToDelete}
      />
      
      {/* Upload Tokens Dialog */}
      <UploadTokensDialog 
        isOpen={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        uploadedTokens={uploadedTokens}
        setUploadedTokens={setUploadedTokens}
      />
      
      {/* Reset History Dialog */}
      <ResetHistoryDialog 
        isOpen={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
      />
    </main>
  )
}
