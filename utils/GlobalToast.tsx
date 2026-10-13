'use client';

import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function GlobalToast() {
  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message?: any) => {
      if (message) {
        toast(String(message), {
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '16px',
            border: '1px solid #334155',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}