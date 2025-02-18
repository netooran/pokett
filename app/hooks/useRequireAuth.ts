import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStytchUser } from '@stytch/nextjs';

const useRequireAuth = () => {
  const { user, isInitialized } = useStytchUser();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [user, isInitialized, router]);
};

export default useRequireAuth;
