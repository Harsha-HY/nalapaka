import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Smartphone, Save, CheckCircle2, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodePayment } from '@/components/QRCodePayment';

interface PaymentSettingsProps {
  hotelId: string;
  hotelName: string;
}

const UPI_PATTERN = /^[\w.\-]{2,}@[\w.\-]{2,}$/;

export function PaymentSettings({ hotelId, hotelName }: PaymentSettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [bankName, setBankName] = useState('');
  const [scannerUrl, setScannerUrl] = useState('');
  const [initialUpiId, setInitialUpiId] = useState('');
  const [initialUpiName, setInitialUpiName] = useState('');
  const [initialBankName, setInitialBankName] = useState('');
  const [initialScannerUrl, setInitialScannerUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('hotels')
        .select('upi_id, upi_name, upi_bank_name, upi_scanner_url')
        .eq('id', hotelId)
        .maybeSingle();
      if (cancelled) return;
      const id = (data as any)?.upi_id ?? '';
      const name = (data as any)?.upi_name ?? '';
      const bank = (data as any)?.upi_bank_name ?? '';
      const scanner = (data as any)?.upi_scanner_url ?? '';
      setUpiId(id);
      setUpiName(name);
      setBankName(bank);
      setScannerUrl(scanner);
      setInitialUpiId(id);
      setInitialUpiName(name);
      setInitialBankName(bank);
      setInitialScannerUrl(scanner);
      setEditing(!id && !scanner);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  const dirty = upiId !== initialUpiId || upiName !== initialUpiName || bankName !== initialBankName || scannerUrl !== initialScannerUrl;
  const trimmedId = upiId.trim();
  const valid = trimmedId === '' || UPI_PATTERN.test(trimmedId);

  const handleUploadScanner = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Scanner photo must be under 4MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${hotelId}/payment-scanner.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const url = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl + `?v=${Date.now()}`;
      setScannerUrl(url);
      toast.success('Scanner photo uploaded. Press Save to activate it.');
    } catch (e: any) {
      toast.error(e.message || 'Scanner upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!valid) {
      toast.error('Invalid UPI ID format. Example: name@bank');
      return;
    }
    setSaving(true);
    const nextName = upiName.trim() || hotelName;
    const nextBank = bankName.trim();
    const { error } = await supabase
      .from('hotels')
      .update({
        upi_id: trimmedId || null,
        upi_name: nextName || null,
        upi_bank_name: nextBank || null,
        upi_scanner_url: scannerUrl || null,
      } as any)
      .eq('id', hotelId);
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Failed to save UPI settings');
      return;
    }
    setUpiName(nextName);
    setBankName(nextBank);
    setInitialUpiId(trimmedId);
    setInitialUpiName(nextName);
    setInitialBankName(nextBank);
    setInitialScannerUrl(scannerUrl);
    setEditing(false);
    toast.success('UPI settings saved');
    window.dispatchEvent(new Event('hotel-upi-updated'));
  };

  const handleCancel = () => {
    setUpiId(initialUpiId);
    setUpiName(initialUpiName);
    setBankName(initialBankName);
    setScannerUrl(initialScannerUrl);
    setEditing(false);
  };

  const showSavedView = !editing && (initialUpiId || initialScannerUrl) && !loading;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> Payment Settings — {hotelName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSavedView ? (
            <div className="rounded-lg border-2 border-success bg-success/10 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-success">UPI saved & active</p>
                  {initialUpiId && (
                    <p className="text-sm"><span className="text-muted-foreground">UPI ID:</span> <strong className="font-mono break-all">{initialUpiId}</strong></p>
                  )}
                  {initialBankName && (
                    <p className="text-sm"><span className="text-muted-foreground">Bank:</span> <strong>{initialBankName}</strong></p>
                  )}
                  {initialScannerUrl && <p className="text-xs text-success">Scanner photo uploaded</p>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Change</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the UPI ID to generate a payment QR. If QR generation fails, upload your UPI scanner photo as a fallback.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input id="upi-id" placeholder="9876543210@ybl" value={upiId} onChange={(e) => setUpiId(e.target.value)} disabled={loading || saving} autoComplete="off" />
                  {!valid && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Format: name@bank</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upi-bank">Bank Name</Label>
                  <Input id="upi-bank" placeholder="e.g. PhonePe / SBI / HDFC" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={loading || saving} autoComplete="off" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upi-name">Payee Name</Label>
                <Input id="upi-name" placeholder={hotelName} value={upiName} onChange={(e) => setUpiName(e.target.value)} disabled={loading || saving} autoComplete="off" />
              </div>

              <div className="space-y-2">
                <Label>Upload Scanner Photo</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadScanner(e.target.files?.[0] || null)} />
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || loading || saving}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload Scanner
                  </Button>
                  {scannerUrl && <img src={scannerUrl} alt="UPI scanner preview" className="h-24 w-24 object-contain rounded-md border bg-background" />}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {!initialUpiId && !initialScannerUrl && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> No UPI configured yet</span>}
                </div>
                <div className="flex gap-2">
                  {(initialUpiId || initialScannerUrl) && <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>}
                  <Button onClick={handleSave} disabled={!dirty || !valid || saving || loading}>
                    <Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(initialUpiId || initialScannerUrl) && (
        <Card>
          <CardHeader><CardTitle className="text-base">QR Preview (₹1 test)</CardTitle></CardHeader>
          <CardContent><QRCodePayment amount={1} orderId="preview-test-0000" hotelId={hotelId} size={180} /></CardContent>
        </Card>
      )}
    </div>
  );
}
