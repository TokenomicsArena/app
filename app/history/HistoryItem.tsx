"use client"

import React from "react"
import Image from "next/image"
import { Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HistoryItem as HistoryItemType } from "@/lib/store"

interface HistoryItemProps {
  item: HistoryItemType
  isMobile: boolean
  formatDate: (date: Date) => string
  handleEdit: (id: string) => void
  handleDeleteClick: (id: string) => void
}

export default function HistoryItem({
  item,
  isMobile,
  formatDate,
  handleEdit,
  handleDeleteClick
}: HistoryItemProps) {
  return (
    <React.Fragment>
      <TableRow id={item.id} className="transition-colors duration-500">
        <TableCell className={`font-medium whitespace-nowrap ${isMobile ? "hidden" : ""}`}>
          {formatDate(new Date(item.timestamp))}
        </TableCell>

        <TableCell className={isMobile ? "py-3 px-3" : ""} colSpan={isMobile ? 2 : 1}>
          <div className={`relative rounded-lg overflow-hidden bg-muted ${isMobile ? "h-16" : "h-14"}`}>
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
            {isMobile ? (
              /* Mobile layout - horizontal with both tokens */
              <div className="flex justify-between items-center px-3 h-full relative z-10">
                {/* First token */}
                <div className="flex items-center gap-2">
                  <Image
                    src={item.crypto1.logo || "/placeholder.svg"}
                    alt={item.crypto1.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-medium">{item.crypto1.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.crypto1.symbol} · {item.crypto1AllocationPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="text-muted-foreground mx-2">vs</div>

                {/* Second token */}
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-right">{item.crypto2.name}</div>
                    <div className="text-sm text-muted-foreground text-right">
                      {item.crypto2.symbol} · {(100 - item.crypto1AllocationPercent).toFixed(2)}%
                    </div>
                  </div>
                  <Image
                    src={item.crypto2.logo || "/placeholder.svg"}
                    alt={item.crypto2.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>
              </div>
            ) : (
              /* Desktop layout - unchanged */
              <div className="flex flex-row justify-between items-center px-4 py-0 h-full relative z-10">
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
            )}
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
  )
}
