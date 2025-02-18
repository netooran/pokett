'use client';

import { useStytchUser } from '@stytch/nextjs';
import Link from 'next/link';
import React, { useEffect } from 'react';
import Profile from './Profile';
import { usePathname, useRouter } from 'next/navigation';

const Header = () => {
  const { user, isInitialized } = useStytchUser();
  const pathname = usePathname();
    const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [user, isInitialized, router]);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700">
              <span className="font-mono">Pokett</span>
            </Link>
          </h1>
          {isInitialized && user ? (
            <Profile />
          ) : (
            !isLoginPage && (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
