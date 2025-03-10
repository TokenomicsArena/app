"use client"

import React, { useState, useRef, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useStore, HistoryItem } from "@/lib/store"

// Import components
import HistoryHeader from "./HistoryHeader"
import HistoryTable from "./HistoryTable"
import LoadingState from "./LoadingState"
import EmptyState from "./EmptyState"
import DeleteDialog from "./DeleteDialog"
import RestoreDialog from "./RestoreDialog"

// Import utilities
import { formatDate } from "./utils"

export default function HistoryPage() {
  const { history, removeFromHistory, exportHistory, importHistory } = useStore()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [restoreData, setRestoreData] = useState<{ history: HistoryItem[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useIsMobile()
  
  // Set loading to false after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100) // Short delay to ensure store is hydrated
    
    return () => clearTimeout(timer)
  }, [])
  
  // Handle scrolling to the anchor ID when the page loads
  useEffect(() => {
    // Check if there's a hash in the URL
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.substring(1) // Remove the # character
      const element = document.getElementById(id)
      
      if (element) {
        // Wait a bit for the page to fully render before scrolling
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Add a highlight effect to the row
          element.classList.add('bg-primary/10')
          setTimeout(() => {
            element.classList.remove('bg-primary/10')
          }, 2000) // Remove the highlight after 2 seconds
        }, 300)
      }
    }
  }, [history]) // Re-run when history changes

  const handleEdit = (id: string) => {
    // Navigate to the arena page with the item ID as a query parameter
    router.push(`/?edit=${id}`)
  }

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  return (
    <TooltipProvider>
      <main className="container max-w-6xl mx-auto py-8 px-4">
        <HistoryHeader
          history={history}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          fileInputRef={fileInputRef}
          setRestoreData={setRestoreData}
          setRestoreDialogOpen={setRestoreDialogOpen}
          exportHistory={exportHistory}
        />

        {isLoading ? (
          <LoadingState />
        ) : history.length === 0 ? (
          <EmptyState />
        ) : (
          <HistoryTable
            history={history}
            isMobile={isMobile}
            formatDate={formatDate}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteDialog
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          itemToDelete={itemToDelete}
          setItemToDelete={setItemToDelete}
          removeFromHistory={removeFromHistory}
        />
        
        {/* Restore Confirmation Dialog */}
        <RestoreDialog
          open={restoreDialogOpen}
          setOpen={setRestoreDialogOpen}
          restoreData={restoreData}
          setRestoreData={setRestoreData}
          history={history}
          importHistory={importHistory}
          formatDate={formatDate}
        />
      </main>
    </TooltipProvider>
  )
}
