"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Globe, FileText } from "lucide-react";
import { useTheme } from "../(contexts)/ThemeContext";
import Header from "../(components)/Header";

export default function PrivacyPolicyPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";


  const privacyPrinciples = [
    {
      icon: Shield,
      title: "Data Protection",
      description: "We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction."
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "We are transparent about what data we collect, how we use it, and with whom we share it. You have the right to know and control your data."
    },
    {
      icon: Lock,
      title: "Minimal Collection",
      description: "We only collect the data necessary to provide our services and improve your experience. We don't collect more than we need."
    },
    {
      icon: Users,
      title: "User Control",
      description: "You have control over your personal data. You can access, update, or delete your information at any time through your account settings."
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-slate-100" : "bg-gray-100 text-slate-900"}`}>
      <Header currentPage="home" />
      {/* Back Button */}
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
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
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
          <h2 className="text-3xl font-bold mb-6">Privacy Policy</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            At Dineezy, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
            restaurant management platform and related services.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            By using our services, you agree to the collection and use of information in accordance with this policy. 
            If you do not agree with our policies and practices, please do not use our services.
          </p>
        </section>

        {/* Privacy Principles */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-8">Our Privacy Principles</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {privacyPrinciples.map((principle, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl flex-shrink-0">
                    <principle.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">{principle.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{principle.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Information We Collect</h3>
          
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Personal Information
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>Create an account or register for our services</li>
                <li>Make a reservation or place an order</li>
                <li>Contact us for support or inquiries</li>
                <li>Subscribe to our newsletter or marketing communications</li>
                <li>Participate in surveys or promotional activities</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                This may include your name, email address, phone number, billing address, payment information, 
                and any other information you choose to provide.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Usage Information
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We automatically collect certain information about your use of our services, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage patterns and preferences</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (with your consent)</li>
                <li>Log files and analytics data</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Restaurant Information
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                For restaurant partners, we collect additional information including business details, 
                menu information, operational data, and performance metrics to provide our services effectively.
              </p>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">How We Use Your Information</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our services</li>
              <li><strong>Order Processing:</strong> To process reservations, orders, and payments</li>
              <li><strong>Communication:</strong> To send you updates, notifications, and respond to inquiries</li>
              <li><strong>Personalization:</strong> To customize your experience and provide relevant content</li>
              <li><strong>Analytics:</strong> To analyze usage patterns and improve our platform</li>
              <li><strong>Security:</strong> To protect against fraud and ensure platform security</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
              <li><strong>Marketing:</strong> To send promotional materials (with your consent)</li>
            </ul>
          </div>
        </section>

        {/* Information Sharing */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Information Sharing and Disclosure</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform</li>
              <li><strong>Restaurant Partners:</strong> With restaurants when you place orders or make reservations</li>
              <li><strong>Payment Processors:</strong> With payment processors to handle transactions securely</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>Consent:</strong> When you have given us explicit consent to share your information</li>
            </ul>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Data Security</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Unauthorized access, use, or disclosure</li>
              <li>Accidental loss or destruction</li>
              <li>Malicious attacks and data breaches</li>
              <li>Unauthorized modification or alteration</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              These measures include encryption, secure servers, regular security audits, and employee training. 
              However, no method of transmission over the internet or electronic storage is 100% secure.
            </p>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Your Rights and Choices</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing of your information</li>
              <li><strong>Objection:</strong> Object to processing of your information for certain purposes</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Cookies and Tracking Technologies</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We use cookies and similar tracking technologies to enhance your experience on our platform. 
              Cookies are small text files stored on your device that help us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our services</li>
              <li>Provide personalized content and recommendations</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              You can control cookie settings through your browser preferences. However, disabling cookies may 
              affect the functionality of our platform.
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Data Retention</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
              Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer 
              need your information, we will securely delete or anonymize it.
            </p>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Children's Privacy</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">
              Our services are not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If we become aware that we have collected personal 
              information from a child under 13, we will take steps to delete such information promptly.
            </p>
          </div>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Changes to This Privacy Policy</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for 
              other operational, legal, or regulatory reasons. We will notify you of any material changes by 
              posting the updated policy on our website and updating the "Last updated" date. Your continued 
              use of our services after such changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Contact Us</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p><strong>Email:</strong> webifyit.in@gmail.com</p>
              <p><strong>Phone:</strong> +916394575814, +916389055071</p>
              <p><strong>Address:</strong> Saket Nagar, Kanpur, Uttar Pradesh, India</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This Privacy Policy is effective as of the date listed above and will remain in effect except with respect to any changes in its provisions in the future.
          </p>
        </div>
      </main>
    </div>
  );
}

