import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translateError, showErrorToast, type TranslatedError } from '@/lib/emoji-error-translator';

export interface UseEmojiErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export function useEmojiErrorHandler(options: UseEmojiErrorHandlerOptions = {}) {
  const {
    context = '',
    showToast = true,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const { toast } = useToast();
  const [error, setError] = useState<TranslatedError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback(
    (error: string | Error, retryCallback?: () => Promise<void> | void) => {
      const translated = translateError(error);
      setError(translated);

      if (showToast) {
        showErrorToast(error, toast, context);
      }

      // Auto-retry logic
      if (autoRetry && retryCallback && retryCount < maxRetries) {
        setIsRetrying(true);
        setTimeout(async () => {
          try {
            await retryCallback();
            setError(null);
            setRetryCount(0);
          } catch (retryError) {
            setRetryCount(prev => prev + 1);
            handleError(retryError as Error, retryCallback);
          } finally {
            setIsRetrying(false);
          }
        }, retryDelay);
      }
    },
    [toast, context, showToast, autoRetry, maxRetries, retryDelay, retryCount]
  );

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const retry = useCallback(
    async (retryCallback: () => Promise<void> | void) => {
      if (isRetrying) return;
      
      setIsRetrying(true);
      try {
        await retryCallback();
        clearError();
      } catch (retryError) {
        handleError(retryError as Error, retryCallback);
      } finally {
        setIsRetrying(false);
      }
    },
    [isRetrying, clearError, handleError]
  );

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retry,
  };
}

// Specialized hook for wallet operations
export function useWalletErrorHandler() {
  return useEmojiErrorHandler({
    context: 'wallet',
    showToast: true,
    autoRetry: false,
  });
}

// Specialized hook for NFT operations
export function useNFTErrorHandler() {
  return useEmojiErrorHandler({
    context: 'nft',
    showToast: true,
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 2000,
  });
}

// Specialized hook for file uploads
export function useUploadErrorHandler() {
  return useEmojiErrorHandler({
    context: 'upload',
    showToast: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1500,
  });
}

// Specialized hook for API requests
export function useAPIErrorHandler() {
  return useEmojiErrorHandler({
    context: 'api',
    showToast: true,
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 1000,
  });
}