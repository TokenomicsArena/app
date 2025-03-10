"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, Save, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { calculatePortfolio } from "@/lib/portfolio-utils"
import { embedMetadataInImage, extractMetadataFromImage, downloadDataUrl } from "@/lib/image-metadata"
import { HistoryItem } from "@/lib/store"

interface HistoryHeaderProps {
  history: HistoryItem[]
  isProcessing: boolean
  setIsProcessing: (value: boolean) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  setRestoreData: (data: { history: HistoryItem[] } | null) => void
  setRestoreDialogOpen: (value: boolean) => void
  exportHistory: () => { history: HistoryItem[] }
}

export default function HistoryHeader({
  history,
  isProcessing,
  setIsProcessing,
  fileInputRef,
  setRestoreData,
  setRestoreDialogOpen,
  exportHistory
}: HistoryHeaderProps) {
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

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-3xl font-bold">History</h1>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
        >
          <Link href="/"><ArrowLeft className="h-4 w-4 inline lg:hidden mr-1" /> Back to Arena</Link>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isProcessing || history.length === 0}
          className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestoreClick}
          disabled={isProcessing}
          className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
        >
          <Upload className="h-4 w-4" />
          <span>Restore</span>
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
  )
}
