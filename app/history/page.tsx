"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Edit2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore } from "@/lib/store"

export default function HistoryPage() {
  const { history, removeFromHistory } = useStore()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    // Navigate to the arena page with the item ID as a query parameter
    router.push(`/?edit=${id}`)

    toast({
      title: "Editing selection",
      description: "Loading your previous selection for editing",
    })
  }

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      removeFromHistory(itemToDelete)

      toast({
        title: "Selection removed",
        description: "The selection has been removed from your history",
      })

      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const itemDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - itemDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 7) {
      // Less than a minute
      const diffSeconds = Math.floor(diffTime / 1000)
      if (diffSeconds < 60) {
        return `${diffSeconds} ${diffSeconds === 1 ? 'second' : 'seconds'} ago`
      }
      
      // Less than an hour
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      if (diffMinutes < 60) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
      }
      
      // Less than a day
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
      }
      
      // Less than 7 days
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    } else {
      return itemDate.toISOString().split("T")[0].replace(/-/g, ".")
    }
  }


  return (
    <TooltipProvider>
      <main className="container max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Selection History</h1>

        {history.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">You haven't made any selections yet.</p>
            <Button onClick={() => router.push("/")}>Go to Arena</Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Allocation</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatDate(new Date(item.timestamp))}
                        </TableCell>

                        <TableCell>
                          <div className="relative rounded-lg overflow-hidden bg-muted h-14">
                            {/* Background allocation visualization for first crypto */}
                            <div
                              className="absolute top-0 left-0 h-full"
                              style={{
                                width: `${item.crypto1AllocationPercent.toFixed(2)}%`,
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                              }}
                            ></div>
                            
                            {/* Background allocation visualization for second crypto */}
                            <div
                              className="absolute top-0 right-0 h-full"
                              style={{
                                width: `${(100 - item.crypto1AllocationPercent).toFixed(2)}%`,
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                              }}
                            ></div>

                            {/* Content */}
                            <div className="flex justify-between items-center px-4 h-full relative z-10">
                              {/* First token (always the one with higher allocation) */}
                              <div className="flex items-center gap-2">
                                <Image
                                  src={item.crypto1.logo || "/placeholder.svg"}
                                  alt={item.crypto1.name}
                                  width={28}
                                  height={28}
                                  className="rounded-full"
                                />
                                <div>
                                  <div className="font-medium">{item.crypto1.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.crypto1.symbol} · {item.crypto1AllocationPercent.toFixed(2)}%
                                  </div>
                                </div>
                              </div>

                              {/* Second token */}
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="font-medium">{item.crypto2.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {(100 - item.crypto1AllocationPercent).toFixed(2)}% · {item.crypto2.symbol}
                                  </div>
                                </div>
                                <Image
                                  src={item.crypto2.logo || "/placeholder.svg"}
                                  alt={item.crypto2.name}
                                  width={28}
                                  height={28}
                                  className="rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(item.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  aria-label="Edit selection"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit selection</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(item.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  aria-label="Delete selection"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete selection</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Notes row */}
                      {item.explanation && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={3} className="py-2 px-4">
                            <div className="text-sm text-muted-foreground italic">
                              <span className="font-medium not-italic text-foreground">Note: </span>
                              {item.explanation}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
      </main>
    </TooltipProvider>
  )
}
