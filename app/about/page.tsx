"use client"

import type React from "react"

import Link from "next/link"
import { Twitter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BlueSky } from "@/components/ui/bluesky"

export default function AboutPage() {
  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">About Tokenomics Arena</h1>
      <noscript>
        <p className="text-xl text-red-500 mb-8">This app requires JavaScript to function. Our JavaScript code contains no tracking functionality and is essential for the core features of this application.</p>
      </noscript>
      <p className="text-muted-foreground mb-8">Discover your ideal crypto portfolio through pairwise comparisons</p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-4">
            Tokenomics Arena helps you discover your ideal cryptocurrency portfolio allocation through a series of
            intuitive pairwise comparisons.
          </p>
          <p className="text-muted-foreground mb-4">
            Rather than overwhelming you with complex charts and technical analysis, we break down the decision-making
            process into simple choices between two options at a time.
          </p>
          <p className="text-muted-foreground">
            Over time, your preferences emerge into a portfolio allocation that reflects your
            investment philosophy and risk tolerance.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>You're presented with two cryptocurrencies</li>
            <li>Allocate your hypothetical investment between them using the slider</li>
            <li>Optionally explain your reasoning for future reference</li>
            <li>Submit your choice and continue with new pairs</li>
            <li>Review your history and see your emerging portfolio</li>
          </ol>

          <div className="mt-6">
            <Button asChild>
              <Link href="/">Try It Now</Link>
            </Button>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Twitter</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Follow us for daily crypto insights and updates
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="https://twitter.com/TokenomicsArena" target="_blank">
                <Twitter className="mr-2 h-4 w-4" />
                @TokenomicsArena
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bluesky</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Join our community discussions on Bluesky</CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="https://bsky.app/profile/TokenomicsArena.bsky.social" target="_blank">
              <BlueSky className="mr-2 h-4 w-4" />
                @TokenomicsArena.bsky.social
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
