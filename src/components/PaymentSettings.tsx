import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Smartphone, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodePayment } from '@/components/QRCodePayment';

interface PaymentSettingsProps {
  hotelId: string;
  hotelName: string;
}

const UPI_PATTERN = /^[\w.\-]{2,}@[\w.\-]{2,}$/;

export function PaymentSettings({ hotelId, hotelName }: PaymentSettingsProps) {
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [initialUpiId, setInitialUpiId] = useState('');
  const [initialUpiName, setInitialUpiName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('hotels')
        .select('upi_id, upi_name')
        .eq('id', hotelId)
        .maybeSingle();
      if (cancelled) return;
      const id = (data as any)?.upi_id ?? '';
      const name = (data as any)?.upi_name ?? '';
      setUpiId(id);
      setUpiName(name);
      setInitialUpiId(id);
      setInitialUpiName(name);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  const dirty = upiId !== initialUpiId || upiName !== initialUpiName;
  const trimmedId = upiId.trim();
  const valid = trimmedId === '' || UPI_PATTERN.test(trimmedId);

  const handleSave = async () => {
    if (!valid) {
      toast.error('Invalid UPI ID format. Example: name@bank');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('hotels')
      .update({ upi_id: trimmedId || null, upi_name: upiName.trim() || null } as any)
      .eq('id', hotelId);
    setSaving(false);
    if (error) {
      toast.error('Failed to save UPI settings');
      return;
    }
    setInitialUpiId(trimmedId);
    setInitialUpiName(upiName.trim());
    toast.success('UPI settings saved — this hotel now receives payments to your UPI ID');
    // Force QR preview refresh
    window.dispatchEvent(new Event('hotel-upi-updated'));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> Payment Settings — {hotelName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the UPI ID for this hotel. All online payments scanned from this hotel's QR
            code will go to this UPI account only.
          </p>

          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input
              id="upi-id"
              placeholder="9876543210@ybl"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              disabled={loading || saving}
              autoComplete="off"
            />
            {!valid && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Format must be like name@bank (e.g. 9876543210@ybl)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi-name">Payee Name (shown in customer's UPI app)</Label>
            <Input
              id="upi-name"
              placeholder="e.g. Hotel Saraswati"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              disabled={loading || saving}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {initialUpiId ? (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3 w-3" /> UPI active: <strong>{initialUpiId}</strong>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" /> No UPI configured — customers cannot pay online yet
                </span>
              )}
            </div>
            <Button onClick={handleSave} disabled={!dirty || !valid || saving || loading}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {initialUpiId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Preview (₹1 test)</CardTitle>
          </CardHeader>
          <CardContent>
            <QRCodePayment amount={1} orderId="preview-test-0000" hotelId={hotelId} size={180} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
