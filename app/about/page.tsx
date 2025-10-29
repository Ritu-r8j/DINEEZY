"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Users, Target, Award, Heart } from "lucide-react";
import { useTheme } from "../(contexts)/ThemeContext";

export default function AboutPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";


  const values = [
    {
      icon: Users,
      title: "Customer-Centric",
      description: "We prioritize our customers' dining experience above all else, ensuring every interaction is seamless and memorable."
    },
    {
      icon: Target,
      title: "Innovation",
      description: "We continuously innovate to bring cutting-edge technology solutions that enhance restaurant operations and customer satisfaction."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in every aspect of our service, from platform reliability to customer support."
    },
    {
      icon: Heart,
      title: "Community",
      description: "We believe in building strong communities around great food and exceptional dining experiences."
    }
  ];

  const stats = [
    { number: "500+", label: "Partner Restaurants" },
    { number: "50K+", label: "Happy Customers" },
    { number: "1M+", label: "Orders Processed" },
    { number: "99.9%", label: "Uptime Guarantee" }
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
              <h1 className="text-2xl font-bold">About Dineezy</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Revolutionizing Restaurant Dining</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Dineezy is a comprehensive restaurant management platform that bridges the gap between traditional dining and modern technology. 
            We empower restaurants to provide seamless, contactless experiences while helping customers discover, order, and enjoy exceptional meals.
          </p>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">Our Mission</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                To transform the dining industry by providing innovative technology solutions that enhance both restaurant operations and customer experiences. 
                We believe that great food deserves great technology.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Our platform enables restaurants to streamline their operations, reduce wait times, and increase customer satisfaction through 
                digital menus, QR code ordering, table reservations, and comprehensive management tools.
              </p>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop"
                alt="Restaurant technology"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">What We Offer</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our comprehensive suite of services designed to modernize restaurant operations and enhance customer experiences.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-3">QR Code Ordering</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Contactless ordering system that allows customers to browse menus, place orders, and make payments directly from their smartphones.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-3">Table Reservations</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced reservation management system that helps restaurants optimize table utilization and provide better customer service.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-3">Menu Management</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Dynamic menu management with real-time updates, pricing control, and inventory tracking capabilities.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-3">Order Processing</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Streamlined order processing with kitchen display integration, order tracking, and delivery management.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-3">Payment Integration</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Secure payment processing with multiple payment options including cards, UPI, and digital wallets.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-3">Analytics & Reporting</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive analytics dashboard providing insights into sales, customer behavior, and operational efficiency.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Our Values</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The principles that guide everything we do and shape our commitment to excellence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-3">{value.title}</h4>
                <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        {/* <section className="mb-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-12">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4">Our Impact</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Numbers that reflect our commitment to transforming the restaurant industry.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* Team Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Our Team</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A passionate team of technologists, food enthusiasts, and business experts working together to revolutionize dining experiences.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Users className="h-16 w-16 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Technology Team</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Expert developers and engineers building robust, scalable solutions for the restaurant industry.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Heart className="h-16 w-16 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Customer Success</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Dedicated professionals ensuring our partners receive exceptional support and achieve their goals.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Award className="h-16 w-16 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Business Development</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Strategic partners helping restaurants grow and succeed in the digital age.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-lg">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Restaurant?</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join hundreds of restaurants already using Dineezy to enhance their operations and delight their customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/user/register">
                <button className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Get Started Today
                </button>
              </Link>
              <Link href="/contact">
                <button className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

