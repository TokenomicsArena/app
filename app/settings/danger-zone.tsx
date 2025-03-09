"use client"

import { useState } from "react"
import { Trash2, Save, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore, cryptocurrencies as defaultCryptocurrencies } from "@/lib/store"

type DangerZoneProps = {
  onResetHistory: () => void
  onResetTokens: () => void
}

export default function DangerZone({ onResetHistory, onResetTokens }: DangerZoneProps) {
  const { history, exportHistory, tokens } = useStore()
  
  return (
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
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    className="border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60 w-full sm:w-auto justify-center"
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
                    className="border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60 w-full sm:w-auto justify-center"
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
                  onClick={onResetHistory}
                  className="flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Reset History</span>
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
                  onClick={onResetTokens}
                  className="flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Reset to Defaults</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
