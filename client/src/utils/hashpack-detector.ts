// Dedicated HashPack detection utility
export class HashPackDetector {
  private static instance: HashPackDetector;
  private isDetected = false;
  private callbacks: ((detected: boolean) => void)[] = [];
  
  private constructor() {
    this.startDetection();
  }
  
  static getInstance(): HashPackDetector {
    if (!HashPackDetector.instance) {
      HashPackDetector.instance = new HashPackDetector();
    }
    return HashPackDetector.instance;
  }
  
  private startDetection() {
    // Immediate check
    this.checkHashPack();
    
    // Wait for DOM ready
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => this.checkHashPack());
    }
    
    // Periodic checks for delayed injection
    const intervals = [100, 500, 1000, 2000, 5000];
    intervals.forEach(delay => {
      setTimeout(() => this.checkHashPack(), delay);
    });
    
    // Listen for window events that might indicate HashPack loading
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'object') {
        const data = event.data;
        if (data.type?.includes?.('hashpack') || 
            data.source?.includes?.('hashpack') ||
            data.action?.includes?.('hashpack')) {
          console.log('HashPack window message detected:', event.data);
          this.checkHashPack();
        }
      }
    });
    
    // Monitor window object changes
    this.monitorWindowChanges();
  }
  
  private monitorWindowChanges() {
    // Use MutationObserver to detect script injections
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'SCRIPT' && 
                (element.getAttribute('src')?.includes('hashpack') ||
                 element.textContent?.includes('hashpack'))) {
              console.log('HashPack script detected in DOM');
              setTimeout(() => this.checkHashPack(), 100);
            }
          }
        });
      });
    });
    
    observer.observe(document.head || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  
  private checkHashPack(): boolean {
    const detectionMethods = [
      // Direct window object checks
      () => (window as any).hashpack,
      () => (window as any).hashConnect,
      () => (window as any).HashConnect,
      () => (window as any).hedera,
      () => (window as any).hederaWallet,
      
      // Browser extension API checks
      () => {
        if ((window as any).chrome?.runtime) {
          // Try to detect HashPack extension via Chrome API
          try {
            return (window as any).chrome.runtime.connect?.({name: 'hashpack'});
          } catch (e) {
            return false;
          }
        }
        return false;
      },
      
      // Check ethereum providers more thoroughly
      () => {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return false;
        
        // Check if ethereum itself is HashPack
        if (ethereum.isHashPack) return ethereum;
        
        // Check providers array
        if (ethereum.providers && Array.isArray(ethereum.providers)) {
          return ethereum.providers.find((p: any) => 
            p.isHashPack || 
            p._state?.isHashPack ||
            p.constructor?.name?.toLowerCase().includes('hashpack')
          );
        }
        
        return false;
      },
      
      // Check for HashPack-specific events
      () => {
        try {
          // Dispatch a HashPack-specific event to see if it responds
          const event = new CustomEvent('hashpack-detect');
          window.dispatchEvent(event);
          return false; // This method doesn't return true directly
        } catch (e) {
          return false;
        }
      }
    ];
    
    for (let i = 0; i < detectionMethods.length; i++) {
      try {
        const result = detectionMethods[i]();
        if (result) {
          console.log(`HashPack detected via advanced method ${i + 1}:`, result);
          this.setDetected(true);
          return true;
        }
      } catch (error) {
        console.warn(`Advanced detection method ${i + 1} failed:`, error);
      }
    }
    
    return false;
  }
  
  private setDetected(detected: boolean) {
    if (this.isDetected !== detected) {
      this.isDetected = detected;
      console.log(`HashPack detection status changed: ${detected}`);
      this.callbacks.forEach(callback => callback(detected));
    }
  }
  
  public getDetectionStatus(): boolean {
    return this.isDetected;
  }
  
  public onDetectionChange(callback: (detected: boolean) => void) {
    this.callbacks.push(callback);
    // Immediately call with current status
    callback(this.isDetected);
  }
  
  public forceRecheck(): boolean {
    return this.checkHashPack();
  }
}