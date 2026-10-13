'use client';
import { useTranslation } from '@/utils/useTranslation';import { useState, useEffect } from 'react';
import CareersForm from './CareersForm';


export default function CareersFormWrapper({ jobId, jobDetails }: { jobId?: string; jobDetails?: any }) {
 const {lang ,t}= useTranslation()
  const careers=t.careers;

  return <CareersForm lang={lang} t={t.careers} jobId={jobId} jobDetails={jobDetails} />;
}