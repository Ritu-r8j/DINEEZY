"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Scale, Shield, Users, AlertTriangle, CheckCircle, Phone } from "lucide-react";
import { useTheme } from "../(contexts)/ThemeContext";

export default function TermsConditionsPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";


  const keyTerms = [
    {
      icon: Users,
      title: "User Responsibilities",
      description: "Users must provide accurate information and use the platform responsibly"
    },
    {
      icon: Shield,
      title: "Data Protection",
      description: "We protect user data according to our Privacy Policy and applicable laws"
    },
    {
      icon: Scale,
      title: "Service Availability",
      description: "We strive for 99.9% uptime but cannot guarantee uninterrupted service"
    },
    {
      icon: FileText,
      title: "Intellectual Property",
      description: "Users retain rights to their content while granting us necessary licenses"
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-slate-100" : "bg-gray-100 text-slate-900"}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-center gap-3">
              <img
                src="logo.png"
                alt="Dineezy Logo"
                className={`w-8 h-8 object-cover object-center ${isDarkMode ? "invert" : ""}`}
              />
              <h1 className="text-2xl font-bold">Terms & Conditions</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Last Updated */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Terms & Conditions</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            Welcome to Dineezy! These Terms and Conditions ("Terms") govern your use of our restaurant management 
            platform and related services. By accessing or using our services, you agree to be bound by these Terms. 
            Please read them carefully before using our platform.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Important Notice</h3>
                <p className="text-yellow-800 dark:text-yellow-200">
                  By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms. 
                  If you do not agree to these Terms, please do not use our services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Terms Overview */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-8">Key Terms Overview</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {keyTerms.map((term, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl flex-shrink-0">
                    <term.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">{term.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{term.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Acceptance of Terms */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Acceptance of Terms</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              By accessing and using Dineezy's services, you accept and agree to be bound by the terms and provision 
              of this agreement. Additionally, when using these particular services, you shall be subject to any posted 
              guidelines or rules applicable to such services.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>You must be at least 18 years old to use our services</li>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to use our services only for lawful purposes</li>
              <li>You will not use our services to violate any applicable laws or regulations</li>
            </ul>
          </div>
        </section>

        {/* Service Description */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Service Description</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Dineezy provides a comprehensive restaurant management platform that includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>QR code-based ordering system for contactless dining</li>
              <li>Table reservation management system</li>
              <li>Digital menu management and customization</li>
              <li>Order processing and kitchen display integration</li>
              <li>Payment processing and financial reporting</li>
              <li>Customer relationship management tools</li>
              <li>Analytics and business intelligence features</li>
              <li>Mobile applications for customers and staff</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              We reserve the right to modify, suspend, or discontinue any aspect of our services at any time 
              with or without notice.
            </p>
          </div>
        </section>

        {/* User Accounts */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">User Accounts</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3">Account Creation</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>You must provide accurate, current, and complete information during registration</li>
                  <li>You are responsible for maintaining the security of your account password</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                  <li>You may not create multiple accounts to circumvent our policies</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Account Responsibilities</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must keep your contact information up to date</li>
                  <li>You agree to receive communications from us regarding your account</li>
                  <li>We may suspend or terminate accounts that violate these Terms</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Payment Terms</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3">Pricing and Billing</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Service fees are clearly displayed before order confirmation</li>
                  <li>Prices may vary based on location, time, and demand</li>
                  <li>All prices are inclusive of applicable taxes unless otherwise stated</li>
                  <li>We reserve the right to change pricing with reasonable notice</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Payment Processing</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>We accept various payment methods including credit cards, UPI, and digital wallets</li>
                  <li>Payment is processed securely through our integrated payment gateway</li>
                  <li>Failed payments may result in order cancellation</li>
                  <li>Refunds are processed according to our Refund Policy</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Subscription Services</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                  <li>Auto-renewal can be disabled in your account settings</li>
                  <li>Cancellation requests must be submitted before the next billing cycle</li>
                  <li>No refunds for partial subscription periods unless otherwise specified</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Prohibited Uses */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Prohibited Uses</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You may not use our services for any of the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Violating any applicable laws or regulations</li>
              <li>Transmitting or procuring the sending of spam or unsolicited communications</li>
              <li>Attempting to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfering with or disrupting our services or servers</li>
              <li>Uploading malicious code, viruses, or other harmful content</li>
              <li>Impersonating another person or entity</li>
              <li>Collecting or harvesting user information without consent</li>
              <li>Engaging in fraudulent or deceptive practices</li>
              <li>Using our services to compete with us or develop competing products</li>
            </ul>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Intellectual Property Rights</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3">Our Intellectual Property</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The Dineezy platform, including its design, functionality, and content, is protected by intellectual 
                  property laws. All rights, title, and interest in our services remain our exclusive property.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>You may not copy, modify, or distribute our proprietary software</li>
                  <li>You may not reverse engineer or attempt to extract source code</li>
                  <li>Our trademarks and logos may not be used without written permission</li>
                  <li>You may not create derivative works based on our services</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">User Content</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You retain ownership of content you upload to our platform, but grant us necessary licenses to 
                  provide our services.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>You are responsible for ensuring you have rights to any content you upload</li>
                  <li>You grant us a license to use your content for service provision</li>
                  <li>We may remove content that violates these Terms or applicable laws</li>
                  <li>You represent that your content does not infringe third-party rights</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Limitation of Liability</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              To the maximum extent permitted by law, Dineezy shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Loss of profits, data, or business opportunities</li>
              <li>Service interruptions or downtime</li>
              <li>Third-party actions or content</li>
              <li>Force majeure events beyond our control</li>
              <li>Damages resulting from unauthorized access to your account</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Our total liability to you for any claims arising from these Terms or our services shall not exceed 
              the amount you paid us in the 12 months preceding the claim.
            </p>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Termination</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3">Termination by You</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  You may terminate your account at any time by contacting our support team or using the account 
                  deletion feature in your account settings. Upon termination, your right to use our services 
                  will cease immediately.
                </p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Termination by Us</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We may terminate or suspend your account immediately, without prior notice, for any reason, 
                  including if you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Violate these Terms or our policies</li>
                  <li>Engage in fraudulent or illegal activities</li>
                  <li>Fail to pay required fees</li>
                  <li>Pose a security risk to our platform or other users</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Effect of Termination</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Upon termination, your access to our services will be revoked, and we may delete your account 
                  data according to our data retention policies. Provisions of these Terms that by their nature 
                  should survive termination will remain in effect.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Governing Law */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Governing Law and Dispute Resolution</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3">Governing Law</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  These Terms shall be governed by and construed in accordance with the laws of the State of 
                  California, United States, without regard to conflict of law principles.
                </p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Dispute Resolution</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Any disputes arising from these Terms or our services shall be resolved through:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Good faith negotiations between the parties</li>
                  <li>Binding arbitration if negotiations fail</li>
                  <li>Arbitration shall be conducted in San Francisco, California</li>
                  <li>Each party shall bear their own legal costs unless otherwise determined</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Legal Department</h4>
                <p className="text-gray-600 dark:text-gray-400">Email: webifyit.in@gmail.com</p>
                <p className="text-gray-600 dark:text-gray-400">Phone: +916394575814, +916389055071</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">General Inquiries</h4>
                <p className="text-gray-600 dark:text-gray-400">Email: webifyit.in@gmail.com</p>
                <p className="text-gray-600 dark:text-gray-400">Address: Saket Nagar, Kanpur, Uttar Pradesh, India</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            These Terms and Conditions are effective as of the date listed above and will remain in effect 
            until modified or terminated in accordance with these Terms.
          </p>
        </div>
      </main>
    </div>
  );
}

