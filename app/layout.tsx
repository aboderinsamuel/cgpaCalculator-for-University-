import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UNILAG CGPA Calculator",
  description: "Calculate your University of Lagos CGPA with ease. Track your academic progress and generate professional transcripts.",
  keywords: "UNILAG, CGPA, calculator, University of Lagos, academic, transcript, grades",
  authors: [{ name: "UNILAG CGPA Calculator" }],
  openGraph: {
    title: "UNILAG CGPA Calculator",
    description: "Calculate your University of Lagos CGPA with ease",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
