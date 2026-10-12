import type { Metadata } from "next"
import { ShelfView } from "@/components/shelf-view"

export const metadata: Metadata = {
  title: "Shelf",
}

export default function ShelfPage() {
  return <ShelfView />
}
