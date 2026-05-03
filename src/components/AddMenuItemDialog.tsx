import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHotelContext } from '@/hooks/useHotelContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface AddMenuItemDialogProps {
  onItemAdded: () => void;
}

export function AddMenuItemDialog({ onItemAdded }: AddMenuItemDialogProps) {
  const { hotelId } = useHotelContext();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '', nameKn: '', price: '', category: 'south-indian', timeSlot: 'all',
  });

  const reset = () => {
    setForm({ name: '', nameKn: '', price: '', category: 'south-indian', timeSlot: 'all' });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error('Image must be under 4MB'); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price || !hotelId) { toast.error('Fill name and price'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { toast.error('Invalid price'); return; }

    setSubmitting(true);
    try {
      const idSlug = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const itemId = `${hotelId.slice(0, 8)}-${idSlug}-${Date.now().toString(36)}`;

      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${hotelId}/${itemId}.${ext}`;
        const { error: upErr } = await supabase.storage.from('menu-images').upload(path, imageFile, { upsert: true, contentType: imageFile.type });
        if (upErr) throw upErr;
        image_url = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from('menu_items').insert({
        id: itemId, hotel_id: hotelId,
        name: form.name.trim(), name_kn: form.nameKn.trim() || form.name.trim(),
        price, category: form.category, time_slot: form.timeSlot, is_available: true,
        image_url,
      } as any);
      if (error) throw error;

      toast.success(`Added "${form.name}" to menu`);
      reset();
      setOpen(false);
      onItemAdded();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-1" /> Add New Item
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Photo (optional)</Label>
              {imagePreview ? (
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Tap to upload photo</span>
                  <span className="text-xs">Customers will see this image</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mname">Name (English) *</Label>
              <Input id="mname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masala Dosa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mnamekn">Name (Kannada)</Label>
              <Input id="mnamekn" value={form.nameKn} onChange={(e) => setForm({ ...form, nameKn: e.target.value })} placeholder="ಮಸಾಲೆ ದೋಸೆ" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mprice">Price (₹) *</Label>
              <Input id="mprice" type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="80" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="south-indian">South Indian</SelectItem>
                    <SelectItem value="north-indian">North Indian</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                    <SelectItem value="tandoor">Tandoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Select value={form.timeSlot} onValueChange={(v) => setForm({ ...form, timeSlot: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Day</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
