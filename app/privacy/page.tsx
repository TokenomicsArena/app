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
            <span className="text-foreground font-semibold">This website stores data exclusively on your device — none of your choices or preferences are transfered to any servers</span>, unless you explicitly:
            <ul className="list-disc pl-6 mt-2 space-y-4">
              <li>Share your email address to register to our newsletter, in which case we take all possible measures to protect your email, which is not linked to your activity on this site.</li>
            </ul>
          </li>

          <li>
            This website is open source and automatically deployed using <Link href="https://vercel.com">vercel.com</Link>. You can examine it here: <Link href="https://github.com/eordano/tokenomics">eordano/tokenomics</Link>.
          </li>
          
          <li>
            To protect your privacy, we avoid third-party resources—no external fonts or trackers, since 
            <a 
              target="_blank" 
              className="inline" 
              title="https://www.firstpost.com/world/how-google-uses-fonts-to-track-what-users-do-online-and-sell-data-to-advertisers-12496552.html" 
              href="https://www.firstpost.com/world/how-google-uses-fonts-to-track-what-users-do-online-and-sell-data-to-advertisers-12496552.html"
            >
              <ExternalLink className="h-4 w-4 mx-1 inline" />
              it's a known source of privacy invasions used for tracking and profiling you
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
            title="https://web.archive.org/web/20231209142434/https://therecord.media/browser-users-can-be-tracked-even-when-javascript-is-disabled" 
            href="https://web.archive.org/web/20231209142434/https://therecord.media/browser-users-can-be-tracked-even-when-javascript-is-disabled"
          >
            <ExternalLink className="h-4 w-4 mx-1 inline" />
            the server running this website (and all other websites you visit)
          </a> 
          &nbsp;receives your IP address, browser, operating system, and other identifiable details with each visit. We partially store this data as logs for spam and bot prevention, retaining it for up to one year before automatic deletion. You can mask this information (e.g., with a VPN), and we encourage you to do so for maximum privacy.
        </p>
          
        <p className="mb-2 mt-4 text-muted-foreground">
          We only log your Autonomous System information (i.e., your ISP) and User Agent for up to one year for security and spam prevention, after which they are automatically deleted. All other request headers are discarded.
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
        <h2 className="text-2xl font-semibold mb-4" id="email-subscriptions">Email Subscriptions</h2>
        <p className="text-muted-foreground mb-4">
          If you choose to subscribe to our newsletter, please be aware of the following:
        </p>
        <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
          <li>
            We use Mailchimp for email subscriptions, which complies with GDPR and industry security standards. However, we cannot control their internal logging practices beyond our agreement with them. Your email remains unlinked to your website activity.
          </li>
          <li>
            Our emails include tracking pixels that can detect when you open an email. This is standard industry practice and allows us to measure how good our email campaigns are. You can opt out of this by configuring your email client to block external images, preventing this form of tracking.
          </li>
          <li>
            We commit to sending no more than two emails per week. Typically, you'll only receive about one email per month with important updates.
          </li>
          <li>
            While we don't control Mailchimp's servers, they maintain compliance with GDPR and similar privacy regulations.
          </li>
          <li>
            You can unsubscribe at any time using the link included in every email. We don't maintain separate backups of email lists outside of the Mailchimp platform. We will never share the email address you provide us with any other third party other than Mailchimp for any purpose.
          </li>
        </ul>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Legal Compliance</h2>
        <p className="text-muted-foreground mb-4">
          For users in the European Union or other regulated regions, this architecture was built to comply by default with applicable data protection laws. Our logging practices are designed for security purposes as a legitimate interest.
          This design ensures that your privacy rights are respected following the spirit of the GDPR and other laws. If you believe we are missing something; please contact us at <a href="mailto:privacy@tokenomics-arena.com">privacy@tokenomics-arena.com</a>.
        </p>
      </div>
      
      <p className="text-sm text-muted-foreground mt-12">
        Last updated: March 8, 2025
      </p>
    </main>
  )
}
