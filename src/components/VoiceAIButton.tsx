import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceAI } from '@/hooks/useVoiceAI';
import { cn } from '@/lib/utils';

export function VoiceAIButton() {
  const { isListening, isProcessing, transcript, toggleListening } = useVoiceAI();

  return (
    <>
      {/* Transcript display */}
      {(transcript || isProcessing) && (
        <div className="fixed bottom-36 right-4 z-50 max-w-[280px] bg-card border border-border rounded-xl p-3 shadow-lg">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <p className="text-sm text-foreground">{transcript}</p>
          )}
        </div>
      )}

      {/* Floating mic button - positioned above cart */}
      <button
        onClick={toggleListening}
        className={cn(
          "fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
          isListening
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : "bg-primary text-primary-foreground hover:opacity-90"
        )}
        aria-label={isListening ? 'Stop voice AI' : 'Start voice AI'}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
