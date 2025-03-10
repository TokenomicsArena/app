"use client"

import React from "react"
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
import { toast } from "@/components/ui/use-toast"
import { HistoryItem } from "@/lib/store"

interface RestoreDialogProps {
  open: boolean
  setOpen: (value: boolean) => void
  restoreData: { history: HistoryItem[] } | null
  setRestoreData: (data: { history: HistoryItem[] } | null) => void
  history: HistoryItem[]
  importHistory: (data: { history: HistoryItem[] }) => void
  formatDate: (date: Date) => string
}

export default function RestoreDialog({
  open,
  setOpen,
  restoreData,
  setRestoreData,
  history,
  importHistory,
  formatDate
}: RestoreDialogProps) {
  const confirmRestore = () => {
    if (!restoreData) return;
    
    try {
      // Import the history data
      importHistory(restoreData);
      
      toast({
        title: "Backup restored",
        description: `Successfully restored ${restoreData.history.length} selection(s).`,
      });
      
      // Close the dialog
      setOpen(false);
      setRestoreData(null);
    } catch (error) {
      toast({
        title: "Failed to restore backup",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore backup?</AlertDialogTitle>
          <AlertDialogDescription>
            {restoreData && (
              history.length > 0 
                ? `This will replace your current history (${history.length} selection${history.length !== 1 ? 's' : ''}) with the backup data (${restoreData.history.length} selection${restoreData.history.length !== 1 ? 's' : ''}).`
                : `This will import ${restoreData.history.length} selection${restoreData.history.length !== 1 ? 's' : ''} from the backup.`
            )}
          </AlertDialogDescription>
          
          {/* Additional information outside of AlertDialogDescription */}
          {restoreData && (
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {history.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Your most recent entry:</span>
                  <span>{formatDate(new Date(Math.max(...history.map(item => new Date(item.timestamp).getTime()))))}</span>
                </div>
              )}
              
              {restoreData.history.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Backup's most recent entry:</span>
                  <span>{formatDate(new Date(Math.max(...restoreData.history.map(item => new Date(item.timestamp).getTime()))))}</span>
                </div>
              )}
              
              <div className="mt-4 font-medium text-foreground">
                This action cannot be undone.
              </div>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setRestoreData(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmRestore} className="bg-primary text-primary-foreground">
            Restore
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
