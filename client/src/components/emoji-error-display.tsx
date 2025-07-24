import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { translateError, getErrorSeverityClasses, type TranslatedError } from "@/lib/emoji-error-translator";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface EmojiErrorDisplayProps {
  error: string | Error | TranslatedError | null;
  context?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function EmojiErrorDisplay({ 
  error, 
  context, 
  onRetry, 
  onDismiss, 
  className = "" 
}: EmojiErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  if (!error) return null;
  
  const translated = translateError(error);
  const severityClasses = getErrorSeverityClasses(translated.severity);
  
  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };
  
  return (
    <Alert className={`${severityClasses} ${className} relative`}>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">
          {translated.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-base font-semibold mb-1">
            {translated.title}
          </AlertTitle>
          
          <AlertDescription className="text-sm leading-relaxed mb-3">
            {translated.message}
            {context && (
              <div className="mt-2 text-xs opacity-75">
                <strong>Context:</strong> {context}
              </div>
            )}
          </AlertDescription>
          
          <div className="flex items-center gap-2 flex-wrap">
            {onRetry && translated.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="h-8 text-xs"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {translated.action}
                  </>
                )}
              </Button>
            )}
            
            {translated.code && (
              <details className="text-xs">
                <summary className="cursor-pointer opacity-60 hover:opacity-80">
                  Technical Details
                </summary>
                <code className="block mt-1 p-2 bg-black/10 rounded text-xs font-mono">
                  {translated.code}
                </code>
              </details>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}

// Compact version for inline display
export function CompactEmojiError({ 
  error, 
  context,
  className = "" 
}: Pick<EmojiErrorDisplayProps, 'error' | 'context' | 'className'>) {
  if (!error) return null;
  
  const translated = translateError(error);
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-lg">{translated.emoji}</span>
      <span className="font-medium">{translated.title}:</span>
      <span className="opacity-80">{translated.message}</span>
    </div>
  );
}

// Toast-style floating error
export function FloatingEmojiError({ 
  error, 
  context,
  onDismiss,
  className = "" 
}: Pick<EmojiErrorDisplayProps, 'error' | 'context' | 'onDismiss' | 'className'>) {
  if (!error) return null;
  
  const translated = translateError(error);
  const severityClasses = getErrorSeverityClasses(translated.severity);
  
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <div className={`${severityClasses} p-4 rounded-lg border shadow-lg backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {translated.emoji}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-1">
              {translated.title}
            </div>
            <div className="text-sm opacity-90">
              {translated.message}
            </div>
          </div>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-70 hover:opacity-100 flex-shrink-0"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Error boundary wrapper with emoji translation
export function EmojiErrorBoundary({ 
  children, 
  fallback,
  context 
}: { 
  children: React.ReactNode;
  fallback?: (error: TranslatedError) => React.ReactNode;
  context?: string;
}) {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    const translated = translateError(error);
    
    if (fallback) {
      return <>{fallback(translated)}</>;
    }
    
    return (
      <EmojiErrorDisplay
        error={error}
        context={context}
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
        className="m-4"
      />
    );
  }
  
  try {
    return <>{children}</>;
  } catch (caughtError) {
    setError(caughtError as Error);
    return null;
  }
}