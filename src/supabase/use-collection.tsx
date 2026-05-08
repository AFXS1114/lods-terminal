'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './config';

export interface UseSupabaseCollectionResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: any | null;
}

/**
 * Hook to subscribe to a Supabase table in real-time.
 * mimics the behavior of the previous useCollection hook for Firestore.
 */
export function useSupabaseCollection<T = any>(
  table: string,
  options?: {
    filter?: { column: string; operator: string; value: any } | { column: string; operator: string; value: any }[];
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
): UseSupabaseCollectionResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from(table).select('*');

      if (options?.filter) {
        const filters = Array.isArray(options.filter) ? options.filter : [options.filter];
        
        filters.forEach(f => {
          const { column, operator, value } = f;
          if (operator === '==') query = query.eq(column, value);
          else if (operator === '!=') query = query.neq(column, value);
          else if (operator === 'in') query = query.in(column, value);
          else if (operator === '>') query = query.gt(column, value);
          else if (operator === '<') query = query.lt(column, value);
          else if (operator === '>=') query = query.gte(column, value);
          else if (operator === '<=') query = query.lte(column, value);
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setData(result as T[]);
    } catch (err: any) {
      console.error(`Error fetching collection ${table}:`, {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [table, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();

    // Use a unique channel name to prevent collisions between multiple hook instances
    const channelId = `hook-${table}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, fetchData]);

  return { data, isLoading, error };
}
