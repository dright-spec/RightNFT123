// Emoji-Powered Error Message Translator
// Converts technical errors into user-friendly messages with emojis

export interface TranslatedError {
  emoji: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  action?: string;
  code?: string;
}

// Common error patterns and their translations
const errorPatterns: Array<{
  pattern: RegExp;
  translate: (match: RegExpMatchArray) => TranslatedError;
}> = [
  // Wallet Connection Errors
  {
    pattern: /user rejected|user denied|rejected by user/i,
    translate: () => ({
      emoji: "🚫",
      title: "Connection Cancelled",
      message: "You cancelled the wallet connection. No worries, you can try again anytime!",
      severity: "warning" as const,
      action: "Try connecting again"
    })
  },
  {
    pattern: /wallet not installed|not found|extension not detected/i,
    translate: () => ({
      emoji: "📱",
      title: "Wallet Not Found",
      message: "We couldn't find your wallet extension. Please install it first!",
      severity: "error" as const,
      action: "Install wallet extension"
    })
  },
  {
    pattern: /network error|failed to fetch|connection refused/i,
    translate: () => ({
      emoji: "🌐",
      title: "Network Issue",
      message: "Having trouble connecting to the internet. Check your connection and try again!",
      severity: "error" as const,
      action: "Check internet connection"
    })
  },
  {
    pattern: /insufficient funds|not enough balance/i,
    translate: () => ({
      emoji: "💰",
      title: "Insufficient Funds",
      message: "You don't have enough ETH to complete this transaction. Add more funds to your wallet!",
      severity: "error" as const,
      action: "Add funds to wallet"
    })
  },
  {
    pattern: /gas fee|gas limit exceeded|out of gas/i,
    translate: () => ({
      emoji: "⛽",
      title: "Gas Fee Issue",
      message: "The transaction needs more gas to process. Try increasing the gas limit!",
      severity: "error" as const,
      action: "Increase gas limit"
    })
  },
  {
    pattern: /transaction failed|reverted|execution failed/i,
    translate: () => ({
      emoji: "❌",
      title: "Transaction Failed",
      message: "The blockchain rejected your transaction. This might be due to network congestion or contract issues.",
      severity: "error" as const,
      action: "Try again later"
    })
  },

  // Authentication Errors
  {
    pattern: /unauthorized|not authenticated|login required/i,
    translate: () => ({
      emoji: "🔐",
      title: "Login Required",
      message: "You need to sign in to access this feature. Let's get you logged in!",
      severity: "warning" as const,
      action: "Sign in to continue"
    })
  },
  {
    pattern: /forbidden|access denied|permission denied/i,
    translate: () => ({
      emoji: "🚨",
      title: "Access Denied",
      message: "You don't have permission to do this. Contact support if you think this is a mistake!",
      severity: "error" as const,
      action: "Contact support"
    })
  },

  // File Upload Errors
  {
    pattern: /file too large|size limit exceeded|file size/i,
    translate: () => ({
      emoji: "📁",
      title: "File Too Large",
      message: "Your file is too big! Please choose a smaller file or compress it first.",
      severity: "error" as const,
      action: "Choose smaller file"
    })
  },
  {
    pattern: /invalid file type|unsupported format|wrong format/i,
    translate: () => ({
      emoji: "📄",
      title: "Unsupported File",
      message: "This file type isn't supported. Try using a different format like JPG, PNG, or PDF!",
      severity: "error" as const,
      action: "Use supported format"
    })
  },
  {
    pattern: /upload failed|could not upload/i,
    translate: () => ({
      emoji: "☁️",
      title: "Upload Failed",
      message: "We couldn't upload your file. Check your internet connection and try again!",
      severity: "error" as const,
      action: "Try uploading again"
    })
  },

  // Validation Errors
  {
    pattern: /required field|field is required|cannot be empty/i,
    translate: () => ({
      emoji: "✏️",
      title: "Missing Information",
      message: "Please fill in all the required fields. We need this info to continue!",
      severity: "warning" as const,
      action: "Complete all fields"
    })
  },
  {
    pattern: /invalid email|email format|not a valid email/i,
    translate: () => ({
      emoji: "📧",
      title: "Invalid Email",
      message: "That doesn't look like a valid email address. Please double-check it!",
      severity: "warning" as const,
      action: "Enter valid email"
    })
  },
  {
    pattern: /password too weak|password requirements/i,
    translate: () => ({
      emoji: "🔒",
      title: "Weak Password",
      message: "Your password needs to be stronger! Use a mix of letters, numbers, and symbols.",
      severity: "warning" as const,
      action: "Create stronger password"
    })
  },

  // Database Errors
  {
    pattern: /database error|connection timeout|query failed/i,
    translate: () => ({
      emoji: "🗄️",
      title: "Database Issue",
      message: "We're having trouble accessing our database. Please try again in a moment!",
      severity: "error" as const,
      action: "Try again shortly"
    })
  },
  {
    pattern: /duplicate entry|already exists|unique constraint/i,
    translate: () => ({
      emoji: "🔄",
      title: "Already Exists",
      message: "This item already exists! Please use a different name or check your existing items.",
      severity: "warning" as const,
      action: "Use different name"
    })
  },

  // NFT/Marketplace Errors
  {
    pattern: /not the owner|ownership required|not authorized to sell/i,
    translate: () => ({
      emoji: "👑",
      title: "Not Your NFT",
      message: "You can only sell NFTs that you own. Make sure you're the rightful owner!",
      severity: "error" as const,
      action: "Check NFT ownership"
    })
  },
  {
    pattern: /already listed|listing exists/i,
    translate: () => ({
      emoji: "🏷️",
      title: "Already Listed",
      message: "This NFT is already for sale! You can update the price or remove the listing.",
      severity: "warning" as const,
      action: "Update existing listing"
    })
  },
  {
    pattern: /price too low|minimum price|invalid price/i,
    translate: () => ({
      emoji: "💎",
      title: "Price Issue",
      message: "The price needs to be higher or in the correct format. Try setting a valid price!",
      severity: "warning" as const,
      action: "Set valid price"
    })
  },

  // API Errors
  {
    pattern: /rate limit|too many requests|throttled/i,
    translate: () => ({
      emoji: "⏰",
      title: "Slow Down",
      message: "You're making requests too quickly! Please wait a moment before trying again.",
      severity: "warning" as const,
      action: "Wait and try again"
    })
  },
  {
    pattern: /server error|internal error|500/i,
    translate: () => ({
      emoji: "🤖",
      title: "Server Error",
      message: "Something went wrong on our end. Our team has been notified and we'll fix it soon!",
      severity: "error" as const,
      action: "Try again later"
    })
  },
  {
    pattern: /timeout|request timeout|took too long/i,
    translate: () => ({
      emoji: "⏱️",
      title: "Request Timeout",
      message: "That took longer than expected! The server might be busy. Try again in a moment.",
      severity: "warning" as const,
      action: "Try again"
    })
  },

  // IPFS/Storage Errors
  {
    pattern: /ipfs|pinning failed|metadata upload/i,
    translate: () => ({
      emoji: "🌍",
      title: "Storage Issue",
      message: "We're having trouble storing your files on the decentralized network. Please try again!",
      severity: "error" as const,
      action: "Retry upload"
    })
  },

  // YouTube/Social Media Errors
  {
    pattern: /youtube api|video not found|channel not found/i,
    translate: () => ({
      emoji: "📺",
      title: "YouTube Issue",
      message: "We couldn't find that YouTube video or channel. Make sure the link is correct!",
      severity: "error" as const,
      action: "Check YouTube link"
    })
  },
  {
    pattern: /verification failed|ownership not verified/i,
    translate: () => ({
      emoji: "✅",
      title: "Verification Failed",
      message: "We couldn't verify your ownership. Please follow the verification steps carefully!",
      severity: "error" as const,
      action: "Follow verification guide"
    })
  }
];

// Default fallback for unknown errors
const defaultError = (originalError: string): TranslatedError => ({
  emoji: "⚠️",
  title: "Something Went Wrong",
  message: "We encountered an unexpected issue. Don't worry, our team is on it!",
  severity: "error" as const,
  action: "Try again or contact support",
  code: originalError.slice(0, 100) // Truncate long error messages
});

/**
 * Translates technical error messages into user-friendly ones with emojis
 */
export function translateError(error: string | Error): TranslatedError {
  const errorMessage = error instanceof Error ? error.message : error;
  
  // Try to match against known patterns
  for (const { pattern, translate } of errorPatterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return translate(match);
    }
  }
  
  // Return default translation if no pattern matches
  return defaultError(errorMessage);
}

/**
 * Creates a user-friendly error message with emoji and styling
 */
export function formatErrorMessage(translatedError: TranslatedError): string {
  return `${translatedError.emoji} ${translatedError.title}: ${translatedError.message}`;
}

/**
 * Gets appropriate CSS classes based on error severity
 */
export function getErrorSeverityClasses(severity: TranslatedError['severity']): string {
  switch (severity) {
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200';
  }
}

/**
 * Enhanced error translator with context awareness
 */
export class EmojiErrorTranslator {
  private context: string = '';
  
  setContext(context: string) {
    this.context = context;
  }
  
  translate(error: string | Error): TranslatedError {
    const translated = translateError(error);
    
    // Add context-specific enhancements
    if (this.context === 'wallet') {
      translated.message += ' 💡 Make sure your wallet is unlocked and connected to the right network!';
    } else if (this.context === 'nft') {
      translated.message += ' 🎨 NFT operations can sometimes take a moment to process on the blockchain.';
    } else if (this.context === 'upload') {
      translated.message += ' 📤 Large files may take longer to upload to IPFS.';
    }
    
    return translated;
  }
}

// Export singleton instance
export const emojiErrorTranslator = new EmojiErrorTranslator();

// Helper function to translate and display errors in toast notifications
export function showErrorToast(
  error: string | Error, 
  toast: any, 
  context?: string
): void {
  if (context) {
    emojiErrorTranslator.setContext(context);
  }
  
  const translated = emojiErrorTranslator.translate(error);
  
  toast({
    title: `${translated.emoji} ${translated.title}`,
    description: translated.message,
    variant: translated.severity === 'error' ? 'destructive' : 'default',
    action: translated.action ? {
      altText: translated.action,
      children: translated.action
    } : undefined,
  });
}