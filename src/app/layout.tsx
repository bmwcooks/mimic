import type { Metadata } from "next"
import { Fraunces, Source_Sans_3 } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  title: {
    default: "Mimic",
    template: "%s · Mimic",
  },
  description:
    "A personal TCGplayer catalog. Choose the games, sets, and fields you want to keep.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
