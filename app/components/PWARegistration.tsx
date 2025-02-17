'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../pwa';

export default function PWARegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
} 