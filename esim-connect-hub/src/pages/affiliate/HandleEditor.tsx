import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function HandleEditor({ initialHandle }: { initialHandle: string | null }) {
  const [handle, setHandle] = useState(initialHandle ?? '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => { setHandle(initialHandle ?? ''); }, [initialHandle]);

  const valid = HANDLE_REGEX.test(handle);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await apiClient.updateAffiliateHandle(handle);
      toast({ title: 'Handle saved', description: `Your public handle is now ${handle}` });
      qc.invalidateQueries({ queryKey: ['affiliate-gamification'] });
      qc.invalidateQueries({ queryKey: ['affiliate-leaderboard'] });
    } catch (e: any) {
      const msg = e?.response?.data?.errorMessage || e?.message || 'Failed to save handle';
      toast({ title: 'Could not save handle', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label>Public handle (shown on the leaderboard)</Label>
        <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ezza_w" />
        {!valid && handle.length > 0 && (
          <div className="text-xs text-red-600 mt-1">3–20 characters, letters/numbers/underscore only.</div>
        )}
      </div>
      <Button onClick={save} disabled={!valid || saving || handle === initialHandle}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
