"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { AtSign, Send, Twitter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

export default function AboutPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Subscribed!",
        description: `You've been added to our newsletter with ${email}`,
      })
      setEmail("")
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">About Tokenomics Arena</h1>
      <noscript>
      <p className="text-xl text-red mb-8">This app requires javascript to work.</p>
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

      <div className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Subscribe to Our Newsletter</CardTitle>
            <CardDescription>Get the latest updates on crypto trends and portfolio strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
                {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
              </Button>
            </form>
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="mb-2">Your privacy matters to us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Emails are handled by Mailchimp</li>
                <li>We recommend using <a href="https://relay.firefox.com/" target="_blank" className="underline">Firefox Relay</a> for enhanced privacy</li>
                <li>We send at most 2 emails per week (typically once monthly)</li>
              </ul>
              <p className="mt-2">
                <Link href="/privacy#email-subscriptions" className="text-primary underline">
                  Read our full email privacy policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Twitter</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Follow us for daily crypto insights and updates
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="https://twitter.com" target="_blank">
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
              <Link href="https://bsky.app" target="_blank">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                  <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" />
                  <path d="M12 8c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4z" />
                </svg>
                @tokenomics.bsky.social
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Farcaster</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Engage with our content on Farcaster</CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="https://www.farcaster.xyz/" target="_blank">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                @TokenomicsArena
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
