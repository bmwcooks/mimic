import type { Metadata } from "next"
import { Browse } from "@/components/browse"

export const metadata: Metadata = {
  title: "Browse",
}

export default function HomePage() {
  return <Browse />
}
