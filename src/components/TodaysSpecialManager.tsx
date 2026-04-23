import { useState } from 'react';
import { Plus, Trash2, Sparkles, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDailySpecials } from '@/hooks/useDailySpecials';
import { useMenuItems } from '@/hooks/useMenuItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TodaysSpecialManager() {
  const { specials, addSpecial, removeSpecial } = useDailySpecials();
  const { menuItems, refreshMenuItems } = useMenuItems();
  const [newName, setNewName] = useState('');
  const [newNameKn, setNewNameKn] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const specialMenuItems = menuItems.filter((m) => (m as any).is_special || (m as any).isSpecial);

  const toggleMenuSpecial = async (itemId: string, current: boolean) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_special: !current })
      .eq('id', itemId);
    if (error) {
      toast.error('Failed to update');
      return;
    }
    toast.success(!current ? "Marked as Today's Special" : 'Removed from specials');
    refreshMenuItems();
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newPrice) {
      toast.error('Name and price required');
      return;
    }
    setAdding(true);
    try {
      await addSpecial({
        name: newName.trim(),
        name_kn: newNameKn.trim() || newName.trim(),
        price: Number(newPrice),
        note: newNote.trim() || undefined,
      });
      setNewName('');
      setNewNameKn('');
      setNewPrice('');
      setNewNote('');
      toast.success("Today's Special added");
    } catch {
      toast.error('Failed to add special');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Today's Special — Free-form chef's specials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Dish name (English)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="ಹೆಸರು (Kannada)" value={newNameKn} onChange={(e) => setNewNameKn(e.target.value)} />
            <Input placeholder="Price (₹)" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            <Input placeholder="Optional note (e.g. limited time)" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
          </div>
          <Button onClick={handleAdd} disabled={adding} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-1" /> {adding ? 'Adding…' : "Add Today's Special"}
          </Button>

          {specials.length > 0 && (
            <div className="space-y-2 pt-3 border-t">
              {specials.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {s.name} {s.name_kn && s.name_kn !== s.name && <span className="text-muted-foreground text-sm">({s.name_kn})</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">₹{s.price} {s.note && `· ${s.note}`}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeSpecial(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Mark existing menu items as Special
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Currently marked: <Badge variant="secondary">{specialMenuItems.length}</Badge>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-auto">
            {menuItems.map((item) => {
              const isSpecial = (item as any).is_special ?? (item as any).isSpecial ?? false;
              return (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isSpecial ? 'default' : 'outline'}
                    onClick={() => toggleMenuSpecial(item.id, isSpecial)}
                  >
                    <Star className={`h-3 w-3 mr-1 ${isSpecial ? 'fill-current' : ''}`} />
                    {isSpecial ? 'Special' : 'Mark'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
