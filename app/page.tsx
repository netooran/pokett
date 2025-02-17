'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './pwa';

export default function Home() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-4">
            Split expenses <span className="text-indigo-700">effortlessly</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Track, split, and settle expenses with friends and groups. No more
            awkward money talks.
          </p>
          <div className="mt-8">
            <a
              href="/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800"
            >
              Get Started - It&apos;s Free
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Group Expenses
            </h3>
            <p className="text-gray-700">
              Create groups for trips, roommates, or events. Split bills fairly
              among members.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Calculations
            </h3>
            <p className="text-gray-700">
              Let Pokett handle the math. Get instant calculations for who owes
              what.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Settlement
            </h3>
            <p className="text-gray-700">
              See balances at a glance and settle up with just a few clicks.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                1. Add Expenses
              </div>
              <p className="text-gray-700">
                Enter your expenses and select who was involved
              </p>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                2. Split Costs
              </div>
              <p className="text-gray-700">
                Choose how to split - equally or custom amounts
              </p>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                3. Settle Up
              </div>
              <p className="text-gray-700">
                See who owes what and settle balances easily
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
