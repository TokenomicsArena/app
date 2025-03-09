"use client"

import Image from "next/image"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export default function DenylistManagement() {
  // Get tokens and denylist from the store
  const { 
    tokens,
    deniedTokens,
    toggleDenyToken,
    resetDenylist
  } = useStore()
  
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
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Denylist Management</CardTitle>
        <CardDescription>
          Manage tokens that are excluded from comparisons in the arena
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="w-full">
            <p className="text-sm text-muted-foreground mb-2">
              Denied tokens ({deniedTokens.length}) are excluded from the token selection process.
              They will not appear in the arena for comparison.
            </p>
            
            {deniedTokens.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {deniedTokens.map(tokenId => {
                  const token = tokens.find(t => t.id === tokenId);
                  return token ? (
                    <div 
                      key={token.id}
                      className="flex items-center gap-2 bg-muted/80 rounded-full pl-1 pr-2 py-1"
                    >
                      <Image
                        src={token.logo}
                        alt={token.name}
                        width={24}
                        height={24}
                        className="rounded-full grayscale"
                      />
                      <span className="text-sm">{token.symbol}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded-full hover:bg-background/80"
                        onClick={() => toggleDenylist(token.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">No tokens are currently denied</p>
            )}
          </div>
          
          {deniedTokens.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetDenylist();
                toast({
                  title: "Denylist reset",
                  description: "All tokens have been removed from the denylist",
                });
              }}
              className="h-9 w-full sm:w-auto justify-center"
            >
              Reset Denylist
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
