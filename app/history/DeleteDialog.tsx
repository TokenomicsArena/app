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

interface DeleteDialogProps {
  open: boolean
  setOpen: (value: boolean) => void
  itemToDelete: string | null
  setItemToDelete: (value: string | null) => void
  removeFromHistory: (id: string) => void
}

export default function DeleteDialog({
  open,
  setOpen,
  itemToDelete,
  setItemToDelete,
  removeFromHistory
}: DeleteDialogProps) {
  const confirmDelete = () => {
    if (itemToDelete) {
      removeFromHistory(itemToDelete)

      toast({
        title: "Selection removed",
        description: "The selection has been removed from your history",
      })

      setOpen(false)
      setItemToDelete(null)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this selection from your history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
