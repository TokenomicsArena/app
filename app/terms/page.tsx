"use client"

import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
      <p className="text-muted-foreground mb-8">By using Tokenomics Arena, you agree to the following terms and conditions</p>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground mb-4">
          By accessing or using Tokenomics Arena, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use this website.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Data Storage</h2>
        <p className="text-muted-foreground mb-4">
          All data is stored locally on your device. The server doesn't store any information about you other than logs without personally identifiable information for anti-abuse and aggregated usage metrics.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
        <p className="text-muted-foreground mb-4">
          Tokenomics Arena is provided "as is" without any warranties, expressed or implied. We do not guarantee the accuracy of information presented on this website. The cryptocurrency allocations and portfolio suggestions are for educational and entertainment purposes only and should not be considered financial advice.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
        <p className="text-muted-foreground mb-4">
          In no event shall Tokenomics Arena be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Tokenomics Arena, even if we have been notified of the possibility of such damage.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. External Links</h2>
        <p className="text-muted-foreground mb-4">
          Tokenomics Arena may contain links to external websites that are not provided or maintained by us. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Modifications</h2>
        <p className="text-muted-foreground mb-4">
          We may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the current version of these terms and conditions.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Governing Law</h2>
        <p className="text-muted-foreground mb-4">
          These terms and conditions are governed by and construed in accordance with applicable laws, and any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts.
        </p>
      </div>
      
      <p className="text-muted-foreground mb-12">
        If you have any questions about these Terms and Conditions, please contact us.
      </p>
      
      <p className="text-sm text-muted-foreground mt-12">
        Last updated: March 8, 2025
      </p>
    </main>
  )
}
