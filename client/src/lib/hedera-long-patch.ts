// Hedera SDK Long.js patch for browser compatibility
// This fixes "cannot read properties of undefined reading 'high'" error

export function patchLongForHedera() {
  console.log("Patching Protobuf Long.js instance...");
  
  // Set up global polyfills
  (window as any).global = window;
  
  // Basic Buffer polyfill for Hedera SDK
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      from: (data: any, encoding?: string): Uint8Array => {
        if (typeof data === 'string') {
          if (encoding === 'base64') {
            const binaryString = atob(data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
          }
          return new TextEncoder().encode(data);
        }
        if (data instanceof ArrayBuffer) {
          return new Uint8Array(data);
        }
        if (data instanceof Uint8Array) {
          return data;
        }
        if (Array.isArray(data)) {
          return new Uint8Array(data);
        }
        return new Uint8Array(0);
      },
      isBuffer: (obj: any) => obj instanceof Uint8Array,
      concat: (arrays: Uint8Array[]) => {
        const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const arr of arrays) {
          result.set(arr, offset);
          offset += arr.length;
        }
        return result;
      },
      byteLength: (str: string, encoding?: string) => {
        if (encoding === 'base64') {
          return Math.floor(str.length * 3 / 4);
        }
        return new TextEncoder().encode(str).length;
      }
    };
  }

  // Patch Long.js when/if it loads
  // This handles the Hedera SDK's internal Long usage
  try {
    // Try to import Long from various possible locations
    const possibleLongs = [
      (window as any).Long,
      (window as any).long,
      (window as any).dcodeIO?.Long
    ];

    for (const Long of possibleLongs) {
      if (Long && !Long._hederaPatched) {
        patchLongInstance(Long);
        console.log("Long.js patched successfully");
        break;
      }
    }
  } catch (e) {
    console.warn("Long.js not yet available, will patch when loaded");
  }

  // Also intercept dynamic imports to patch Long when it loads
  const originalImport = (window as any).__originalDynamicImport || (window as any).import;
  (window as any).__originalDynamicImport = originalImport;
  
  // Try to override Long property if it doesn't exist yet
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'Long');
    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(window, 'Long', {
        configurable: true,
        get() {
          return (window as any)._Long;
        },
        set(value) {
          if (value && !value._hederaPatched) {
            patchLongInstance(value);
            console.log("Long.js patched via setter");
          }
          (window as any)._Long = value;
        }
      });
    }
  } catch (e) {
    // Property might already be defined, that's ok
    console.debug("Long property already defined, will patch when available");
  }
}

function patchLongInstance(Long: any) {
  // Save original methods
  const originalFromValue = Long.fromValue;
  const originalFromNumber = Long.fromNumber;
  const originalFromString = Long.fromString;
  
  // Patch fromValue to handle undefined/null
  Long.fromValue = function(val: any, unsigned?: boolean) {
    if (val === undefined || val === null) {
      return Long.ZERO || new Long(0, 0, unsigned);
    }
    // Handle objects with high/low properties  
    if (typeof val === 'object' && val !== null) {
      if ('high' in val && 'low' in val) {
        return new Long(val.low, val.high, val.unsigned || unsigned);
      }
      // Handle BigInt
      if (typeof val.toBigInt === 'function') {
        const bigIntVal = val.toBigInt();
        return Long.fromString(bigIntVal.toString(), unsigned);
      }
    }
    try {
      return originalFromValue.call(this, val, unsigned);
    } catch (e) {
      console.warn('Long.fromValue error, returning ZERO:', e);
      return Long.ZERO || new Long(0, 0, unsigned);
    }
  };
  
  // Patch fromNumber to handle undefined/null
  Long.fromNumber = function(val: any, unsigned?: boolean) {
    if (val === undefined || val === null || isNaN(val)) {
      return Long.ZERO || new Long(0, 0, unsigned);
    }
    try {
      return originalFromNumber.call(this, val, unsigned);
    } catch (e) {
      console.warn('Long.fromNumber error, returning ZERO:', e);
      return Long.ZERO || new Long(0, 0, unsigned);
    }
  };
  
  // Patch fromString to handle undefined/null
  Long.fromString = function(val: any, unsigned?: boolean | number, radix?: number) {
    if (val === undefined || val === null || val === '') {
      return Long.ZERO || new Long(0, 0, unsigned as boolean);
    }
    try {
      return originalFromString.call(this, val, unsigned, radix);
    } catch (e) {
      console.warn('Long.fromString error, returning ZERO:', e);
      return Long.ZERO || new Long(0, 0, unsigned as boolean);
    }
  };
  
  // Mark as patched
  Long._hederaPatched = true;
}