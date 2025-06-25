// Post-connection error handler specifically for the decryption issue
export class PostConnectionHandler {
  private isActive = false;
  private originalErrorHandler: ((event: ErrorEvent) => boolean | void) | null = null;
  private originalConsoleError: typeof console.error;
  private originalUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor() {
    this.originalConsoleError = console.error;
  }

  // Activate post-connection error suppression
  activate() {
    if (this.isActive) return;
    this.isActive = true;

    console.log('🛡️ Activating post-connection error suppression...');

    // Suppress specific decryption errors that occur after wallet connection
    this.originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = String(message);
      if (this.isDecryptionError(errorMessage)) {
        console.log('🛡️ Suppressed post-connection decryption error:', errorMessage.substring(0, 100));
        return true; // Prevent default error handling
      }
      
      // Call original handler for other errors
      if (this.originalErrorHandler) {
        return this.originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Handle unhandled promise rejections
    this.originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      const errorMessage = String(event.reason?.message || event.reason);
      if (this.isDecryptionError(errorMessage)) {
        console.log('🛡️ Suppressed post-connection promise rejection:', errorMessage.substring(0, 100));
        event.preventDefault();
        return;
      }

      // Call original handler for other rejections
      if (this.originalUnhandledRejection) {
        this.originalUnhandledRejection.call(window, event);
      }
    };

    // Override console.error temporarily
    console.error = (...args) => {
      const message = args.join(' ');
      if (this.isDecryptionError(message)) {
        console.log('🛡️ Suppressed post-connection console error:', message.substring(0, 100));
        return;
      }
      this.originalConsoleError.apply(console, args);
    };

    // Auto-deactivate after 30 seconds (post-connection phase should be complete)
    setTimeout(() => {
      this.deactivate();
    }, 30000);
  }

  // Deactivate error suppression
  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;

    console.log('🛡️ Deactivating post-connection error suppression...');

    // Restore original handlers
    window.onerror = this.originalErrorHandler;
    window.onunhandledrejection = this.originalUnhandledRejection;
    console.error = this.originalConsoleError;

    // Clear references
    this.originalErrorHandler = null;
    this.originalUnhandledRejection = null;
  }

  private isDecryptionError(message: string): boolean {
    const decryptionPatterns = [
      'Invalid encrypted text received',
      'Decryption halted',
      'Invalid encrypted text',
      'Decryption failed',
      'crypto_box_open_easy',
      'LibSodium',
      'runtime-error-plugin',
      'Failed to decrypt',
      'Encryption error',
      'NaCl decrypt'
    ];

    return decryptionPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  isCurrentlyActive(): boolean {
    return this.isActive;
  }
}

// Global instance for post-connection error handling
export const postConnectionHandler = new PostConnectionHandler();