'use client';

import { useStytchUser } from '@stytch/nextjs';
import { StytchLogin } from '@stytch/nextjs';
import { OAuthProviders, Products } from '@stytch/vanilla-js';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getDomainFromWindow } from '@/utils/urlUtils';

export default function LoginPage() {
  const { user, isInitialized } = useStytchUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      setLoading(false);
      if (user) {
        router.replace('/groups');
      }
    }
  }, [user, isInitialized, router]);

  const styles = useMemo(
    () => ({
      buttons: {
        primary: {
          backgroundColor: '#4A37BE',
          borderColor: '#4A37BE',
        },
      },
    }),
    []
  );

  const redirectURL = useMemo(
    () => getDomainFromWindow() + '/authenticate',
    []
  );

  const config = useMemo(
    () => ({
      products: [Products.emailMagicLinks, Products.oauth],
      oauthOptions: {
        providers: [{ type: OAuthProviders.Google }],
      },
      emailMagicLinksOptions: {
        loginRedirectURL: redirectURL,
        loginExpirationMinutes: 60,
        signupRedirectURL: redirectURL,
        signupExpirationMinutes: 60,
      },
    }),
    [redirectURL]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      <div className="flex-1 flex flex-col justify-center items-start p-8 lg:p-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Split expenses <span className="text-indigo-600">effortlessly</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-2xl">
          Track, split, and settle expenses with friends and groups. No more
          awkward money talks.
        </p>
      </div>

      <div className="flex-1 flex justify-center items-center p-4">
        <StytchLogin config={config} styles={styles} />
      </div>
    </div>
  );
}
