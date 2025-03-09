"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useStore } from "@/lib/store"

type ResetHistoryDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function ResetHistoryDialog({ 
  isOpen, 
  onOpenChange
}: ResetHistoryDialogProps) {
  const { history, clearHistory } = useStore()
  const [resetConfirmText, setResetConfirmText] = useState("")
  const RESET_CONFIRMATION_TEXT = "DELETE ALL HISTORY"
  
  // Confirm reset history
  const confirmResetHistory = () => {
    if (resetConfirmText !== RESET_CONFIRMATION_TEXT) return
    
    // Clear the history in the store
    clearHistory()
    
    toast({
      title: "History reset",
      description: "Successfully cleared all history",
    })
    
    onOpenChange(false)
    setResetConfirmText("")
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (!open) setResetConfirmText("")
      onOpenChange(open)
    }}>
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
            className="bg-destructive text-destructive-foreground flex items-center gap-2 justify-center"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset All History</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
