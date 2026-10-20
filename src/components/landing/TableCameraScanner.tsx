import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, QrCode, AlertCircle, CheckCircle2, RotateCcw, Volume2, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import jsQR from 'jsqr';
import { useLanguage } from '@/contexts/LanguageContext';

interface TableCameraScannerProps {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

export const TableCameraScanner: React.FC<TableCameraScannerProps> = ({
  isOpen = true,
  onClose,
  inline = false,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [manualHotel, setManualHotel] = useState('nalapaka-heritage');
  const [manualTable, setManualTable] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Play gentle sound on scan
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {}
  };

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleScanSuccess = useCallback(
    (codeData: string) => {
      stopCamera();
      playScanBeep();
      setScannedUrl(codeData);

      // Analyze codeData: could be full URL or relative path
      try {
        if (codeData.startsWith('http://') || codeData.startsWith('https://')) {
          const urlObj = new URL(codeData);
          if (urlObj.pathname.startsWith('/guest')) {
            setTimeout(() => {
              navigate(urlObj.pathname);
            }, 500);
            return;
          }
        }
        
        if (codeData.startsWith('/guest')) {
          setTimeout(() => {
            navigate(codeData);
          }, 500);
          return;
        }

        // If it's formatted as "hotelSlug/tableNumber"
        if (codeData.includes('/')) {
          setTimeout(() => {
            navigate(`/guest/${codeData}`);
          }, 500);
          return;
        }

        // Fallback default
        navigate(`/guest/nalapaka/${codeData}`);
      } catch {
        navigate('/guest');
      }
    },
    [navigate, stopCamera]
  );

  const startCamera = async () => {
    setCameraError(null);
    setScannedUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings, or enter your table number manually below.'
          : 'Unable to start camera. Please enter table number manually.'
      );
      setCameraActive(false);
    }
  };

  const tickScan = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(tickScan);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleScanSuccess(code.data);
      return;
    }

    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTable.trim()) return;
    navigate(`/guest/${manualHotel.trim()}/${encodeURIComponent(manualTable.trim())}`);
  };

  if (!isOpen && !inline) return null;

  const content = (
    <div className="w-full max-w-xl mx-auto bg-[#FAF7F2] rounded-3xl border border-[#DFCFC0] shadow-xl overflow-hidden p-6 sm:p-8 text-[#2B231D]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD3] mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#B85D36] text-white flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#2B231D]">
              {language === 'kn' ? 'ಟೇಬಲ್ QR ಸ್ಕ್ಯಾನರ್' : 'Scan Table QR to Order'}
            </h3>
            <p className="text-[11px] text-[#7A6E62]">
              {language === 'kn'
                ? 'ನಿಮ್ಮ ಟೇಬಲ್ ಮೇಲಿರುವ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ನೇರವಾಗಿ ಮೆನು ಪಡೆಯಿರಿ'
                : 'Point your camera at the QR disc on your dining table'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-[#7B6E60] hover:text-[#2B231D] hover:bg-[#EFE7DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs: Camera vs Manual Entry */}
      <div className="flex gap-2 p-1 bg-[#F1E8DC] rounded-xl mb-5 border border-[#E0D2C2]">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'camera'
              ? 'bg-white text-[#B85D36] shadow-xs'
              : 'text-[#645648] hover:text-[#2B231D]'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Live Camera Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'manual'
              ? 'bg-white text-[#B85D36] shadow-xs'
              : 'text-[#645648] hover:text-[#2B231D]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Enter Table Number</span>
        </button>
      </div>

      {/* Camera Viewfinder */}
      {activeTab === 'camera' && (
        <div className="space-y-4">
          <div className="relative w-full aspect-video sm:aspect-square max-h-[340px] bg-black rounded-2xl overflow-hidden border-2 border-[#D8C7B8] flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder Target Overlays */}
            {cameraActive && !scannedUrl && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* 4 Corner Markers */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-white/40 rounded-2xl">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#B85D36] -mt-1 -ml-1 rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#B85D36] -mt-1 -mr-1 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#B85D36] -mb-1 -ml-1 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#B85D36] -mb-1 -mr-1 rounded-br" />

                  {/* Gentle sweeping scan line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#B85D36] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Scanned Success Alert */}
            {scannedUrl && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                <h4 className="text-white font-bold text-sm">Table QR Recognized!</h4>
                <p className="text-xs text-[#D8CAC0] truncate max-w-xs">{scannedUrl}</p>
                <span className="text-[11px] text-amber-300">Entering your dining session...</span>
              </div>
            )}

            {/* Error or Inactive Camera Fallback */}
            {!cameraActive && (
              <div className="p-6 text-center text-white/80 space-y-3">
                <Camera className="w-10 h-10 mx-auto text-[#D2C3B5] stroke-1" />
                <p className="text-xs max-w-xs mx-auto leading-relaxed text-[#DFD3C7]">
                  {cameraError || 'Camera initializing... Tap below if prompt did not appear.'}
                </p>
                <Button
                  size="sm"
                  onClick={startCamera}
                  className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white text-xs h-9 px-4 rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Try Camera Again
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#7A6D61] px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Direct browser camera scan. Zero data stored.
            </span>
            <button
              onClick={() => setActiveTab('manual')}
              className="text-[#B85D36] hover:underline font-semibold"
            >
              Camera not working?
            </button>
          </div>
        </div>
      )}

      {/* Manual Table Number Fallback */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#44382D]">
              Restaurant Branch / Slug:
            </label>
            <Input
              type="text"
              value={manualHotel}
              onChange={(e) => setManualHotel(e.target.value)}
              placeholder="e.g. nalapaka-heritage"
              required
              className="h-11 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#44382D]">
              Table Number on your table:
            </label>
            <Input
              type="text"
              value={manualTable}
              onChange={(e) => setManualTable(e.target.value)}
              placeholder="e.g. 4, 7, VIP-2"
              required
              className="h-11 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-[#B85D36] hover:bg-[#9F4D2A] text-white font-semibold text-sm rounded-xl gap-2 mt-2"
          >
            <span>Open Table Order Screen</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
};
