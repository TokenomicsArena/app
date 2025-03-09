"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Edit2, Trash2, Save, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { calculatePortfolio } from "@/lib/portfolio-utils"
import { embedMetadataInImage, extractMetadataFromImage, downloadDataUrl } from "@/lib/image-metadata"
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
import { useStore, HistoryItem } from "@/lib/store"

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


  const handleSave = async () => {
    if (history.length === 0) {
      toast({
        title: "No data to save",
        description: "You haven't made any selections yet.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Calculate portfolio data for visualization
      const portfolioData = calculatePortfolio(history);
      
      // Export history data
      const historyData = exportHistory();
      
      // Generate image with embedded metadata
      const resultJson = await embedMetadataInImage(portfolioData, historyData);
      
      // Download the image
      downloadDataUrl(resultJson, `tokenomics-arena-backup-${new Date().toISOString().split('T')[0]}.png`);
      
      toast({
        title: "Backup saved",
        description: "Your selection history has been saved as an image file.",
      });
    } catch (error) {
      toast({
        title: "Failed to save backup",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreClick = () => {
    // Explicitly trigger the file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference is not available");
      toast({
        title: "Error",
        description: "Could not open file picker. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("File selected:", file.name);
    setIsProcessing(true);
    
    try {
      // Extract metadata from the image
      console.log("Extracting metadata...");
      const data = await extractMetadataFromImage(file);
      console.log("Metadata extracted:", data);
      
      // Validate the data
      if (!data || !Array.isArray(data.history)) {
        throw new Error("The metadata in the image was not a valid backup for Tokenomics Arena data");
      }
      
      // Store the data for confirmation
      setRestoreData(data);
      
      // Open the confirmation dialog
      setRestoreDialogOpen(true);
    } catch (error) {
      console.error("Restore error:", error);
      toast({
        title: "Failed to restore backup",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

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
      setRestoreDialogOpen(false);
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
    <TooltipProvider>
      <main className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Selection History</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isProcessing || history.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestoreClick}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Restore
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              onClick={(e) => console.log("File input clicked")}
              accept="image/png"
              className="hidden"
              id="file-upload"
            />
          </div>
        </div>

      {isLoading ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">Loading...</p>
        </div>
      ) : history.length === 0 ? (
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
                      <TableRow id={item.id} className="transition-colors duration-500">
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
        
        {/* Restore Confirmation Dialog */}
        <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
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
      </main>
    </TooltipProvider>
  )
}
