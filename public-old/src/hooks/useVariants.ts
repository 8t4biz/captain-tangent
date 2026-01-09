import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Variant, Database } from '../lib/database.types';
import { normalizeAction } from '../lib/utils';

export function useVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVariants();

    const channel = supabase
      .channel('variants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'variants' },
        () => {
          fetchVariants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchVariants() {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVariants((data as Variant[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch variants');
    } finally {
      setLoading(false);
    }
  }

  async function addVariant(variant: Database['public']['Tables']['variants']['Insert']) {
    try {
      console.log('🔵 addVariant called with:', variant);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      console.log('🔵 Current user:', user?.id, 'Error:', userError);

      if (userError) {
        console.error('🔴 Error getting user:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }

      if (!user) {
        throw new Error('You must be logged in to create variants');
      }

      const insertData: any = {
        mvp: variant.mvp,
        name: variant.name,
        status: variant.status,
        metric: variant.metric,
        target: variant.target,
        week: variant.week,
        user_id: user.id
      };

      if (variant.result !== undefined && variant.result !== null) {
        insertData.result = variant.result;
      }

      if (variant.next_action && variant.next_action.trim()) {
        insertData.next_action = variant.next_action.trim();
      }

      if (variant.owner && variant.owner.trim()) {
        insertData.owner = variant.owner.trim();
      }

      if (variant.due) {
        insertData.due = variant.due.trim() || null;
      }

      if (variant.verdict) {
        insertData.verdict = variant.verdict;
      }

      if (variant.verdict_manual) {
        insertData.verdict_manual = variant.verdict_manual;
      }

      if (variant.iteration !== undefined) {
        insertData.iteration = variant.iteration;
      }

      if (variant.action_type && variant.action_type.trim()) {
        insertData.action_type = variant.action_type.trim();
      }

      if (variant.notes && variant.notes.trim()) {
        insertData.notes = variant.notes.trim();
      }

      if (variant.channel) {
        insertData.channel = variant.channel;
      }

      if (variant.channel_detail && variant.channel_detail.trim()) {
        insertData.channel_detail = variant.channel_detail.trim();
      }

      if (variant.exposure_n !== undefined && variant.exposure_n !== null) {
        insertData.exposure_n = variant.exposure_n;
      }

      if (variant.baseline_pct !== undefined && variant.baseline_pct !== null) {
        insertData.baseline_pct = variant.baseline_pct;
      }

      if (variant.decision_rule) {
        insertData.decision_rule = variant.decision_rule;
      }

      const { next, overflow } = normalizeAction(insertData.next_action);
      insertData.next_action = next || null;
      if (overflow) {
        insertData.notes = [insertData.notes, overflow].filter(Boolean).join('\n\n');
      }

      console.log('🔵 Inserting data:', insertData);

      const { data, error } = await supabase
        .from('variants')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('🔴 Supabase insert error:', error);
        const errorMsg = `Database error: ${error.message || 'Unknown error'}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`;
        throw new Error(errorMsg);
      }

      if (!data) {
        throw new Error('No data returned from insert');
      }

      console.log('✅ Variant created successfully:', data);
      await fetchVariants();
      setError(null);
      return data as Variant;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add variant';
      setError(errorMessage);
      console.error('🔴 addVariant error:', err);
      return null;
    }
  }

  async function updateVariant(id: string, updates: Database['public']['Tables']['variants']['Update']) {
    try {
      console.log('🔵 updateVariant called with id:', id, 'updates:', updates);

      const processedUpdates = { ...updates };

      if ('next_action' in updates) {
        const { next, overflow } = normalizeAction(updates.next_action);
        processedUpdates.next_action = next || null;
        if (overflow) {
          const variant = variants.find(v => v.id === id);
          const existingNotes = variant?.notes || '';
          processedUpdates.notes = [existingNotes, overflow].filter(Boolean).join('\n\n');
        }
      }

      if ('due' in updates && updates.due === '') {
        processedUpdates.due = null;
      }

      if ('owner' in updates && updates.owner === '') {
        processedUpdates.owner = null;
      }

      if ('channel_detail' in updates && updates.channel_detail === '') {
        processedUpdates.channel_detail = null;
      }

      console.log('🔵 Sending to database:', processedUpdates);

      const { data, error } = await (supabase
        .from('variants') as any)
        .update(processedUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('🔴 Supabase update error:', error);
        console.error('🔴 Error details - code:', error.code, 'message:', error.message, 'details:', error.details, 'hint:', error.hint);
        const errorMsg = `Database error: ${error.message || 'Unknown error'}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`;
        throw new Error(errorMsg);
      }

      console.log('✅ Update successful:', data);

      await fetchVariants();
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update variant';
      setError(errorMessage);
      console.error('updateVariant error:', err);
      throw err;
    }
  }

  async function deleteVariant(id: string) {
    try {
      const { error } = await supabase
        .from('variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchVariants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete variant');
    }
  }

  return {
    variants,
    loading,
    error,
    addVariant,
    updateVariant,
    deleteVariant,
    refresh: fetchVariants,
  };
}
