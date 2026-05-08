'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './config';

export interface UseSupabaseDocResult<T> {
  data: T | null;
  isLoading: boolean;
  error: any | null;
}

/**
 * Hook to subscribe to a single Supabase document (row) in real-time.
 */
export function useSupabaseDoc<T = any>(
  table: string,
  id: string | null | undefined
): UseSupabaseDocResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);

  const fetchDoc = useCallback(async () => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setData(result as T);
    } catch (err) {
      console.error(`Error fetching document ${table}/${id}:`, err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [table, id]);

  useEffect(() => {
    fetchDoc();

    if (!id) return;

    // Subscribe to real-time changes for this specific row
    const channel = supabase
      .channel(`public:${table}:id=eq.${id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: table,
          filter: `id=eq.${id}` 
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setData(null);
          } else {
            setData(payload.new as T);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, id, fetchDoc]);

  return { data, isLoading, error };
}
