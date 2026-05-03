import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  itemId: string;
  hotelId: string | null | undefined;
  onUploaded: () => void;
}

export function MenuItemImageUploader({ itemId, hotelId, onUploaded }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file || !hotelId) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Image must be under 4MB'); return; }
    setBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${hotelId}/${itemId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('menu-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const url = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl + `?v=${Date.now()}`;
      const { error } = await supabase.from('menu_items').update({ image_url: url } as any).eq('id', itemId);
      if (error) throw error;
      toast.success('Photo updated');
      onUploaded();
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Change photo"
        onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </Button>
    </>
  );
}
