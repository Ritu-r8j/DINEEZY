"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, XCircle, Clock, CreditCard, AlertCircle, CheckCircle, Phone } from "lucide-react";
import { useTheme } from "../(contexts)/ThemeContext";

export default function RefundPolicyPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";


  const refundScenarios = [
    {
      icon: CheckCircle,
      title: "Order Cancelled Before Preparation",
      description: "Full refund within 2-4 business days",
      timeframe: "Within 15 minutes of order placement",
      color: "text-green-600"
    },
    {
      icon: Clock,
      title: "Order Delayed Beyond Expected Time",
      description: "Partial refund or store credit",
      timeframe: "More than 30 minutes delay",
      color: "text-yellow-600"
    },
    {
      icon: XCircle,
      title: "Wrong Order Delivered",
      description: "Full refund + replacement order",
      timeframe: "Immediate upon verification",
      color: "text-red-600"
    },
    {
      icon: AlertCircle,
      title: "Food Quality Issues",
      description: "Full refund or replacement",
      timeframe: "Within 2 hours of delivery",
      color: "text-orange-600"
    }
  ];

  const refundProcess = [
    {
      step: 1,
      title: "Contact Support",
      description: "Reach out to our customer support team via phone, email, or live chat"
    },
    {
      step: 2,
      title: "Provide Details",
      description: "Share your order number and reason for refund request"
    },
    {
      step: 3,
      title: "Verification",
      description: "Our team will verify the details and process your request"
    },
    {
      step: 4,
      title: "Refund Processing",
      description: "Refund will be processed to your original payment method"
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
              <h1 className="text-2xl font-bold">Refund & Cancellation Policy</h1>
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
          <h2 className="text-3xl font-bold mb-6">Refund & Cancellation Policy</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            At Dineezy, we strive to provide excellent service and ensure customer satisfaction. This policy outlines 
            our refund and cancellation procedures for orders placed through our platform. We understand that 
            sometimes things don't go as planned, and we're here to help make it right.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Important Notice</h3>
                <p className="text-blue-800 dark:text-blue-200">
                  All refund requests are subject to verification and approval. Refunds will be processed to the 
                  original payment method used for the order. Processing times may vary depending on your bank or 
                  payment provider.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Refund Scenarios */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-8">Refund Scenarios</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {refundScenarios.map((scenario, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0">
                    <scenario.icon className={`h-6 w-6 ${scenario.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-2">{scenario.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{scenario.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 font-medium">{scenario.timeframe}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cancellation Policy */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Order Cancellation Policy</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3">Pre-Order Cancellations</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Orders can be cancelled within 15 minutes of placement without any charges</li>
                  <li>Cancellations after 15 minutes but before preparation starts may incur a small processing fee</li>
                  <li>Once food preparation begins, cancellation is not possible</li>
                  <li>Special orders or custom items may have different cancellation terms</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Reservation Cancellations</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Reservations can be cancelled up to 2 hours before the scheduled time</li>
                  <li>Cancellations within 2 hours may result in a cancellation fee</li>
                  <li>No-show reservations may be charged the full reservation amount</li>
                  <li>Group reservations (8+ people) require 24-hour notice for cancellation</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Subscription Cancellations</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Monthly subscriptions can be cancelled anytime before the next billing cycle</li>
                  <li>Annual subscriptions can be cancelled within 30 days for a full refund</li>
                  <li>Usage-based fees are non-refundable</li>
                  <li>Cancellation requests must be submitted through your account dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Refund Process */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-8">Refund Process</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {refundProcess.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                  <span className="text-2xl font-bold text-primary">{step.step}</span>
                </div>
                <h4 className="text-lg font-semibold mb-3">{step.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Refund Timeline */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Refund Timeline</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <CreditCard className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-semibold">Credit/Debit Cards</h4>
                  <p className="text-gray-600 dark:text-gray-400">2-5 business days</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <RefreshCw className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-semibold">UPI Payments</h4>
                  <p className="text-gray-600 dark:text-gray-400">1-3 business days</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-semibold">Digital Wallets</h4>
                  <p className="text-gray-600 dark:text-gray-400">3-7 business days</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-semibold">Bank Transfers</h4>
                  <p className="text-gray-600 dark:text-gray-400">5-10 business days</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Non-Refundable Items */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Non-Refundable Items</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The following items and situations are generally not eligible for refunds:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Orders that have been delivered and accepted by the customer</li>
              <li>Custom orders or special dietary requirements that were fulfilled correctly</li>
              <li>Orders cancelled after food preparation has begun</li>
              <li>Service fees and delivery charges (unless the order was cancelled before preparation)</li>
              <li>Gift cards and promotional credits</li>
              <li>Orders placed during promotional periods with specific terms</li>
              <li>Damages caused by customer negligence or misuse</li>
            </ul>
          </div>
        </section>

        {/* Dispute Resolution */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Dispute Resolution</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you disagree with our refund decision, you can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Contact our customer support team for a second review</li>
              <li>Provide additional documentation or evidence to support your claim</li>
              <li>Request to speak with a supervisor or manager</li>
              <li>Submit a formal complaint through our feedback system</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              We are committed to resolving disputes fairly and will work with you to find a satisfactory solution.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Contact Us for Refunds</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              To request a refund or cancellation, please contact us through any of the following methods:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Customer Support</h4>
                <p className="text-gray-600 dark:text-gray-400">Phone: +916394575814, +916389055071</p>
                <p className="text-gray-600 dark:text-gray-400">Email: webifyit.in@gmail.com</p>
              
              </div>
              <div>
                <h4 className="font-semibold mb-2">Refund Department</h4>
                <p className="text-gray-600 dark:text-gray-400">Email: webifyit.in@gmail.com</p>
                <p className="text-gray-600 dark:text-gray-400">Response Time: Within 24 hours</p>
                <p className="text-gray-600 dark:text-gray-400">Business Hours: Mon-Fri, 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Updates */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Policy Updates</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">
              We reserve the right to modify this refund and cancellation policy at any time. Changes will be 
              posted on this page with an updated revision date. Continued use of our services after changes 
              constitutes acceptance of the updated policy. We encourage you to review this policy periodically 
              to stay informed about our refund procedures.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This Refund & Cancellation Policy is effective as of the date listed above and applies to all orders 
            placed through the Dineezy platform.
          </p>
        </div>
      </main>
    </div>
  );
}

