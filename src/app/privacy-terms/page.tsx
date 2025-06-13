import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ChevronRight } from "lucide-react";

export default function PrivacyTermsPage() {
  return (
    <div className="min-h-screen bg-cream-DEFAULT">
      <Navbar />

      <main className="container-max py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-textColor-DEFAULT mb-4 px-2">
            Privacy Policy & Terms of Service
          </h1>
          <p className="text-textColor-muted text-base sm:text-lg px-2">
            Last updated: June 2025
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl border border-borderColor-DEFAULT p-4 sm:p-6 mb-8 sm:mb-12 mx-2 sm:mx-0">
          <h2 className="text-lg sm:text-xl font-semibold text-textColor-DEFAULT mb-4">
            Table of Contents
          </h2>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="font-medium text-terracotta-DEFAULT mb-2">
                Privacy Policy
              </h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="#data-collection"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Data Collection
                  </a>
                </li>
                <li>
                  <a
                    href="#data-usage"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    How We Use Your Data
                  </a>
                </li>
                <li>
                  <a
                    href="#cookies"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Cookies & Tracking
                  </a>
                </li>
                <li>
                  <a
                    href="#third-party"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Third-Party Services
                  </a>
                </li>
                <li>
                  <a
                    href="#user-rights"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Your Rights
                  </a>
                </li>
                <li>
                  <a
                    href="#gdpr-compliance"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    GDPR Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-terracotta-DEFAULT mb-2">
                Terms of Service
              </h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="#account-terms"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Account Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#subscription"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Subscription & Billing
                  </a>
                </li>
                <li>
                  <a
                    href="#usage-rules"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Usage Rules
                  </a>
                </li>
                <li>
                  <a
                    href="#limitations"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Limitations
                  </a>
                </li>
                <li>
                  <a
                    href="#cancellation"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Cancellation
                  </a>
                </li>
                <li>
                  <a
                    href="#jurisdiction"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Jurisdiction & Governing Law
                  </a>
                </li>
                <li>
                  <a
                    href="#liability"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Liability Limitations
                  </a>
                </li>
                <li>
                  <a
                    href="#disputes"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Dispute Resolution
                  </a>
                </li>
                <li>
                  <a
                    href="#intellectual-property"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    Intellectual Property
                  </a>
                </li>
                <li>
                  <a
                    href="#gdpr-tos"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    GDPR Rights
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Privacy Policy Section */}
          <div className="bg-white rounded-xl border border-borderColor-DEFAULT p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0 mb-8">
            <h2 className="text-3xl font-semibold text-terracotta-DEFAULT mb-8">
              Privacy Policy
            </h2>

            <section id="data-collection" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                Data Collection
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                We collect information you provide directly to us, such as when
                you create an account, subscribe to our service, or contact us
                for support.
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-3 pl-2 sm:pl-4">
                <li>Account information (email, name)</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Usage data and preferences</li>
                <li>Communication records</li>
              </ul>
            </section>

            <section id="data-usage" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                How We Use Your Data
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                We use the information we collect to provide, maintain, and
                improve our services:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-3 pl-2 sm:pl-4">
                <li>Generate personalized startup ideas</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important service updates</li>
                <li>Improve user experience</li>
              </ul>
            </section>

            <section id="cookies" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                Cookies & Tracking
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                We use cookies and similar technologies to enhance your
                experience and analyze usage patterns.
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-3 pl-2 sm:pl-4">
                <li>Essential cookies for site functionality</li>
                <li>Analytics cookies to understand usage</li>
                <li>Preference cookies to remember your settings</li>
              </ul>
            </section>

            <section id="third-party" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                Third-Party Services
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                We integrate with trusted third-party services to provide our
                functionality:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-3 pl-2 sm:pl-4">
                <li>Stripe for secure payment processing</li>
                <li>Supabase for data storage and authentication</li>
                <li>Anthropic for AI-powered idea generation</li>
                <li>EXA API for market research data</li>
              </ul>
            </section>

            <section id="user-rights" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                Your Rights
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-3 pl-2 sm:pl-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section id="gdpr-compliance" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                GDPR Compliance
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                We comply with the General Data Protection Regulation (GDPR) for
                all users, regardless of location. As a French company, we are
                subject to GDPR requirements and extend these protections
                globally. You have the following rights under GDPR:
              </p>
              <div className="bg-cream-DEFAULT p-3 sm:p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-textColor-DEFAULT mb-2">
                  EU User Rights:
                </h4>
                <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2 pl-2">
                  <li>Right to be informed about data processing</li>
                  <li>Right of access to your personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Rights related to automated decision making</li>
                </ul>
              </div>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                <strong>Legal Basis for Processing:</strong> We process your
                data based on:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-3 pl-2 sm:pl-4">
                <li>Contract performance (providing our services)</li>
                <li>Legitimate interests (improving our service)</li>
                <li>Consent (marketing communications)</li>
                <li>Legal obligations (tax and regulatory compliance)</li>
              </ul>
              <br />
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                <strong>Data Requests:</strong> To exercise your GDPR rights or
                make data requests, contact us at:
              </p>
              <div className="bg-terracotta-100 p-3 sm:p-4 rounded-lg">
                <p className="text-textColor-DEFAULT font-medium">
                  Email:{" "}
                  <a
                    href="mailto:richard@hackerscope.ai"
                    className="text-terracotta-DEFAULT hover:underline"
                  >
                    richard@hackerscope.ai
                  </a>
                </p>
                <p className="text-textColor-DEFAULT text-sm mt-2">
                  Subject line: "GDPR Data Request - [Your Request Type]"
                </p>
                <p className="text-textColor-DEFAULT text-sm">
                  We will respond within 30 days as required by GDPR.
                </p>
              </div>
            </section>
          </div>

          {/* Terms of Service Section */}
          <div className="bg-white rounded-xl border border-borderColor-DEFAULT p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <h2 className="text-3xl font-semibold text-terracotta-DEFAULT mb-8">
              Terms of Service
            </h2>

            <section id="account-terms" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                Account Terms
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                By creating an account, you agree to provide accurate
                information and maintain the security of your account
                credentials.
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-3 pl-2 sm:pl-4">
                <li>You must be 18 years or older to use our service</li>
                <li>One account per person or organization</li>
                <li>You are responsible for all activity under your account</li>
                <li>Keep your login credentials secure</li>
              </ul>
            </section>

            <section id="subscription" className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-medium text-textColor-DEFAULT mb-3 sm:mb-4">
                Subscription & Billing
              </h3>
              <p className="text-textColor-DEFAULT mb-4 leading-relaxed">
                Our service operates on a freemium model with clear usage
                limits:
              </p>
              <div className="bg-cream-DEFAULT p-3 sm:p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-textColor-DEFAULT mb-2">
                  Free Tier:
                </h4>
                <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2 pl-2">
                  <li>1 startup idea generation (lifetime limit)</li>
                  <li>No recurring charges</li>
                  <li>Full access to generated idea details</li>
                </ul>
              </div>
              <div className="bg-terracotta-100 p-3 sm:p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-textColor-DEFAULT mb-2">
                  Premium Subscription:
                </h4>
                <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2 pl-2">
                  <li>Up to 12 idea generations per hour</li>
                  <li>Up to 24 idea generations per day</li>
                  <li>Monthly billing (see current pricing on our website)</li>
                  <li>Cancel anytime</li>
                </ul>
              </div>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>All billing is processed securely via Stripe</li>
                <li>Usage limits reset at the top of each hour/day</li>
                <li>No refunds for partial billing periods</li>
                <li>Subscription auto-renews monthly unless cancelled</li>
              </ul>
            </section>

            <section id="usage-rules" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                Usage Rules
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                To maintain a positive experience for all users, please:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>Use the service for legitimate business purposes</li>
                <li>Do not attempt to reverse engineer our AI models</li>
                <li>Respect rate limits and fair usage policies</li>
                <li>Do not share account credentials</li>
              </ul>
            </section>

            <section id="limitations" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                Limitations
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                Our service is provided &quot;as is&quot; with the following
                limitations:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>No guarantee of idea viability or success</li>
                <li>AI-generated content may not always be accurate</li>
                <li>Service availability subject to maintenance</li>
                <li>We reserve the right to modify features</li>
              </ul>
            </section>

            <section id="cancellation" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                Cancellation
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                You may cancel your subscription at any time:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>Cancel through your account dashboard</li>
                <li>Access continues until end of billing period</li>
                <li>Account data retained for 30 days after cancellation</li>
                <li>Reactivation available within retention period</li>
              </ul>
            </section>

            <section id="jurisdiction" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                Jurisdiction & Governing Law
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                These Terms of Service are governed by applicable local laws
                where you reside. HackerScope AI is currently operated as an
                individual business.
              </p>
              <div className="bg-cream-DEFAULT p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-textColor-DEFAULT mb-2">
                  Important Notes:
                </h4>
                <ul className="list-disc list-inside text-textColor-DEFAULT space-y-1">
                  <li>
                    All disputes will be resolved through binding arbitration
                  </li>
                  <li>
                    You retain all consumer protection rights under your local
                    laws
                  </li>
                  <li>
                    These terms will be updated if the business structure
                    changes
                  </li>
                  <li>
                    If any provision is unenforceable, the remainder remains in
                    effect
                  </li>
                </ul>
              </div>
              <p className="text-textColor-DEFAULT">
                For any questions about jurisdiction or applicable laws, please
                contact us at richard@hackerscope.ai.
              </p>
            </section>

            <section id="liability" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                Liability Limitations
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                Our liability is limited to the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>
                  Total liability capped at amount paid in the 12 months prior
                  to claim
                </li>
                <li>
                  No liability for indirect, incidental, or consequential
                  damages
                </li>
                <li>
                  No liability for lost profits, data, or business opportunities
                </li>
                <li>
                  Service provided &quot;as is&quot; without warranties of any
                  kind
                </li>
                <li>Force majeure events exclude us from liability</li>
              </ul>
            </section>

            <section id="disputes" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                Dispute Resolution
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                We encourage resolving disputes through the following process:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>
                  First, contact us directly at richard@hackerscope.ai to
                  resolve informally
                </li>
                <li>
                  If unresolved after 30 days, disputes may proceed to binding
                  arbitration
                </li>
                <li>
                  Arbitration conducted under applicable arbitration rules in
                  your jurisdiction
                </li>
                <li>
                  Class action lawsuits are waived - disputes must be individual
                </li>
                <li>
                  Small claims court remains available for qualifying disputes
                </li>
              </ul>
            </section>

            <section id="intellectual-property" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                Intellectual Property
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                Understanding ownership and responsibilities regarding
                AI-generated content:
              </p>
              <div className="bg-cream-DEFAULT p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-textColor-DEFAULT mb-2">
                  AI-Generated Ideas:
                </h4>
                <ul className="list-disc list-inside text-textColor-DEFAULT space-y-1">
                  <li>
                    Ideas generated by our AI are provided to you for your use
                  </li>
                  <li>
                    We do not claim ownership of the generated startup ideas
                  </li>
                  <li>
                    You receive the ideas &quot;as is&quot; without exclusivity
                    guarantees
                  </li>
                  <li>Similar ideas may be generated for other users</li>
                </ul>
              </div>
              <div className="bg-terracotta-light p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-textColor-DEFAULT mb-2">
                  Your Responsibilities:
                </h4>
                <ul className="list-disc list-inside text-textColor-DEFAULT space-y-1">
                  <li>
                    Conduct your own due diligence before pursuing any idea
                  </li>
                  <li>
                    Verify market research and validate assumptions
                    independently
                  </li>
                  <li>
                    Ensure compliance with applicable laws and regulations
                  </li>
                  <li>
                    Respect existing intellectual property rights of others
                  </li>
                  <li>Perform trademark and patent searches as appropriate</li>
                </ul>
              </div>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>
                  Our platform and AI models remain our intellectual property
                </li>
                <li>
                  You may not reverse engineer or attempt to replicate our AI
                </li>
                <li>
                  Generated ideas are for your business use, not for resale as
                  ideas
                </li>
                <li>We disclaim liability for any IP infringement claims</li>
                <li>
                  You indemnify us against claims arising from your use of
                  generated ideas
                </li>
              </ul>
            </section>

            <section id="gdpr-tos" className="mb-8">
              <h3 className="text-xl font-medium text-textColor-DEFAULT mb-4">
                GDPR Rights (Terms of Service)
              </h3>
              <p className="text-textColor-DEFAULT mb-4">
                For EU users, these additional terms apply under GDPR:
              </p>
              <ul className="list-disc list-inside text-textColor-DEFAULT space-y-2">
                <li>
                  You may withdraw consent for data processing at any time
                </li>
                <li>
                  Withdrawal does not affect lawfulness of prior processing
                </li>
                <li>
                  Some services may become unavailable if you withdraw essential
                  consents
                </li>
                <li>
                  You have the right to lodge complaints with your local data
                  protection authority
                </li>
                <li>
                  Cross-border data transfers are protected by appropriate
                  safeguards
                </li>
                <li>
                  Data retention periods are limited to what is necessary for
                  our purposes
                </li>
              </ul>
              <p className="text-textColor-DEFAULT mt-4">
                <strong>Data Controller:</strong> HackerScope AI operates as the
                data controller for your personal information.
              </p>
            </section>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-borderColor-DEFAULT p-4 sm:p-6 lg:p-8 mt-8 sm:mt-12 mx-2 sm:mx-0">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-textColor-DEFAULT mb-4 text-center">
              Questions?
            </h2>
            <p className="text-textColor-muted mb-4 leading-relaxed text-center">
              If you have any questions about this Privacy Policy or Terms of
              Service, please contact us.
            </p>
            <a
              href="mailto:richard@hackerscope.ai"
              className="text-terracotta-DEFAULT hover:underline font-medium"
            >
              richard@hackerscope.ai
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
