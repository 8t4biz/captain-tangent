import { useEffect, useState } from 'react';
import type { Variant } from '../lib/database.types';

const STORAGE_KEY = 'captain-tangent-variants';

function load(): Variant[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(v: Variant[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}

export function useVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = load();
    setVariants(data);
    setLoading(false);
  }, []);

  async function addVariant(v: Partial<Variant>) {
    const newVariant: Variant = {
      id: crypto.randomUUID(),
      name: v.name || 'New variant',
      mvp: v.mvp || '',
      status: v.status || 'Inbox',
      metric: v.metric || '',
      target: v.target || 0,
      week: v.week || new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      ...v,
    } as Variant;

    const next = [newVariant, ...variants];
    setVariants(next);
    save(next);
    return newVariant;
  }

  async function updateVariant(id: string, updates: Partial<Variant>) {
    const next = variants.map(v =>
      v.id === id ? { ...v, ...updates } : v
    );
    setVariants(next);
    save(next);
  }

  async function deleteVariant(id: string) {
    const next = variants.filter(v => v.id !== id);
    setVariants(next);
    save(next);
  }

  return {
    variants,
    loading,
    error,
    addVariant,
    updateVariant,
    deleteVariant,
  };
}