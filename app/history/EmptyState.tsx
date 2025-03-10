"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function EmptyState() {
  const router = useRouter()
  
  return (
    <div className="text-center py-12 border rounded-lg">
      <p className="text-muted-foreground mb-4">You haven't made any selections yet.</p>
      <Button onClick={() => router.push("/")}>Go to Arena</Button>
    </div>
  )
}
