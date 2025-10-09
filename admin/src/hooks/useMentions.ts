import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import type { IMention } from '../types';
import { CONSTANTS } from '../constants';

export function useMentions() {
  const { get } = useFetchClient();
  const [mentions, setMentions] = useState<IMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMentions = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await get(CONSTANTS.routes.MENTIONS_URL);
        const mentions = data?.data;
        setMentions(mentions || []);
      } catch (error) {
        console.error('Error fetching mentions:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch mentions'));
      } finally {
        setLoading(false);
      }
    };

    fetchMentions();
  }, [get]);

  return { mentions, loading, error };
}
