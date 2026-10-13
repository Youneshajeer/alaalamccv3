import React, { Suspense } from 'react';
import RequestServiceForm from './request-service';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <RequestServiceForm />
    </Suspense>
  );
}