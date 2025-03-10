"use client"

import React from "react"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HistoryItem as HistoryItemType } from "@/lib/store"
import HistoryItem from "./HistoryItem"

interface HistoryTableProps {
  history: HistoryItemType[]
  isMobile: boolean
  formatDate: (date: Date) => string
  handleEdit: (id: string) => void
  handleDeleteClick: (id: string) => void
}

export default function HistoryTable({
  history,
  isMobile,
  formatDate,
  handleEdit,
  handleDeleteClick
}: HistoryTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="hidden sm:table-header-group">
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                isMobile={isMobile}
                formatDate={formatDate}
                handleEdit={handleEdit}
                handleDeleteClick={handleDeleteClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
