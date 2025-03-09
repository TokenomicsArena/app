"use client"

import { ExternalLink } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        At Tokenomics Arena, we prioritize your privacy and transparency. We've engineered this site to deliver top-tier privacy, which we believe is a universal right. Privacy enthusiasts can use it with confidence: we don't collect or store data you actively input into forms, fields, or interactive features on this website.
      </p>


      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">TL;DR</h2>
        
        <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
          <li>
            <span className="text-foreground font-semibold">This website stores data exclusively on your device — none of your choices or preferences are transferred to any servers</span>.
          </li>

          <li>
            This website is open source and automatically deployed using <Link href="https://vercel.com">vercel.com</Link>. You can examine it here: <Link href="https://github.com/TokenomicsArena/app">TokenomicsArena/app</Link>.
          </li>
          
          <li>
            To protect your privacy, we avoid third-party resources—no external fonts or trackers, since 
            <a 
              target="_blank" 
              className="inline-flex items-center hover:underline" 
              title="https://www.firstpost.com/world/how-google-uses-fonts-to-track-what-users-do-online-and-sell-data-to-advertisers-12496552.html" 
              href="https://www.firstpost.com/world/how-google-uses-fonts-to-track-what-users-do-online-and-sell-data-to-advertisers-12496552.html"
            >
              <ExternalLink className="h-4 w-4 mx-1 inline" />
              <span>it's a known source of privacy invasions used for tracking and profiling you</span>
            </a>.
          </li>
          <li>
            <span className="font-bold text-foreground">No tracking or analytics cookies are used</span>. We use a single cookie to remember your theme preference (light or dark mode) and avoid all other cookies. 
          </li>
          <li>
            JavaScript is required for functionality, but our client-side code contains no tracking functionality.
          </li>
        </ul>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Local Storage</h2>
        <p className="mb-4">
          Tokenomics Arena uses your browser's local storage to save:
        </p>
        <ul className="list-disc pl-6">
          <li>Your selection history</li>
          <li>Portfolio algorithm settings</li>
        </ul>
        <p className="mb-2 mt-4 font-bold">
          This data stays on your device, inaccessible to us or third parties, and is never uploaded.
        </p>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Network Information</h2>
        <p className="text-muted-foreground mb-2 mt-4">
          Due to how HTTP and TCP/IP work, 
          <a 
            target="_blank" 
            className="inline-flex items-center hover:underline"
            title="https://web.archive.org/web/20231209142434/https://therecord.media/browser-users-can-be-tracked-even-when-javascript-is-disabled" 
            href="https://web.archive.org/web/20231209142434/https://therecord.media/browser-users-can-be-tracked-even-when-javascript-is-disabled"
          >
            <ExternalLink className="h-4 w-4 mx-1 inline" />
            <span>the server running this website (and all other websites you visit)</span>
          </a> 
          &nbsp;receives your IP address, browser, operating system, and other identifiable details with each visit. You can mask this information (e.g., with a VPN), and we encourage you to do so for maximum privacy.
        </p>
          
        <p className="mb-2 mt-4 text-muted-foreground">
          As this website is hosted on Vercel's infrastructure, Vercel may collect and retain certain server logs and technical information as part of their standard operations. These logs may include IP addresses, request timestamps, and other technical data necessary for the provision of their services. We have limited control over Vercel's data retention practices. For more information, please refer to Vercel's privacy policy.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Cookie Usage</h2>
        <p className="text-muted-foreground mb-2 mt-4">
          Your theme preference (light/dark mode) is stored locally via a cookie and sent to our server with each request for display purposes.
          We don't retain it server-side or share it with anyone.
        </p>
        <p className="text-muted-foreground mb-2 mt-4">
          We refuse to taint your experience by showing you a cookie consent banner for such trivial purpose.
        </p>
        <p className="text-muted-foreground mb-2 mt-4">
          We believe cookie consent banners to be a banalization of the regulatory efforts to make the web safer and more respectful.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Social Media Links</h2>
        <p className="text-muted-foreground mb-4">
          Our website contains links to our social media profiles on platforms like Twitter and Bluesky. Please be aware that clicking these links will take you to external websites with their own privacy policies and data collection practices. We encourage you to review the privacy policies of these third-party sites before interacting with them.
        </p>
        <p className="text-muted-foreground mb-4">
          We do not track your interactions with these social media links, nor do we receive data from these platforms about your visits originating from our website.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Legal Compliance</h2>
        <p className="text-muted-foreground mb-4">
          For users in the European Union or other regulated regions, this architecture was built to comply by default with applicable data protection laws to the extent possible.
          This design ensures that your privacy rights are respected following the spirit of the GDPR and other laws. If you believe we are missing something; please contact us at <a href="mailto:privacy@tokenomics-arena.com">privacy@tokenomics-arena.com</a>.
        </p>
        <p className="text-muted-foreground mb-4">
          If you contact us via email we will use the information you provide (including your email address and any personal details included in your message) solely to respond to your inquiry. We do not use this information for marketing purposes or share it with third parties.
        </p>
      </div>
      
      <p className="text-sm text-muted-foreground mt-12">
        Last updated: March 9, 2025
      </p>
    </main>
  )
}
