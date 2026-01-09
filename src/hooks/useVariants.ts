import { useState, useEffect } from 'react';
import type { Variant, Status } from '../lib/database.types';

export function useVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simule un chargement initial
    setTimeout(() => {
      setVariants([
        {
          id: '1',
          name: 'Example Variant A',
          mvp: 'Onboarding',
          status: 'Review',
          metric: 'Conversion',
          target: 15,
          result: 18,
          week: '2026-01-08',
          iteration: 1,
          channel: 'Twitter',
          verdict_manual: null,
        },
        {
          id: '2',
          name: 'Test B',
          mvp: 'Activation',
          status: 'Inbox',
          metric: 'Signup rate',
          target: 10,
          week: '2026-01-08',
          iteration: 1,
          channel: 'Email',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const updateVariant = async (id: string, updated: Partial<Variant>) => {
    setVariants((vs) => vs.map((v) => (v.id === id ? { ...v, ...updated } : v)));
  };

  const addVariant = async (data: Partial<Variant>) => {
    const newVar = {
      ...data,
      id: Math.random().toString(),
      status: data.status ?? 'Inbox',
    } as Variant;
    setVariants((vs) => [...vs, newVar]);
    return newVar;
  };

  const deleteVariant = async (id: string) => {
    setVariants((vs) => vs.filter((v) => v.id !== id));
  };

  return {
    variants,
    loading,
    error,
    updateVariant,
    addVariant,
    deleteVariant,
  };
}