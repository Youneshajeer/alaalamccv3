'use server'

import { getSupabaseServerClient, } from "@/lib/supabase/supabase-server";


export async function getActiveJobs() {
  const supabase = await getSupabaseServerClient();
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }

    return jobs || [];
  } catch (err) {
    console.error('Unexpected error fetching jobs:', err);
    return [];
  }
}