// Global HashPack session store to share connection across components
import SignClient from "@walletconnect/sign-client";

interface HashPackSessionStore {
  signClient: SignClient | null;
  session: any | null;
  accountId: string | null;
}

class SessionStore {
  private store: HashPackSessionStore = {
    signClient: null,
    session: null,
    accountId: null
  };

  setSession(signClient: SignClient, session: any, accountId: string) {
    console.log('Storing HashPack session:', { 
      topic: session?.topic, 
      accountId,
      hasClient: !!signClient 
    });
    this.store.signClient = signClient;
    this.store.session = session;
    this.store.accountId = accountId;
  }

  getSession(): HashPackSessionStore {
    return this.store;
  }

  hasActiveSession(): boolean {
    const hasSession = !!(this.store.signClient && this.store.session && this.store.accountId);
    console.log('Checking active session:', { 
      hasSession,
      topic: this.store.session?.topic,
      accountId: this.store.accountId
    });
    return hasSession;
  }

  clearSession() {
    console.log('Clearing HashPack session');
    this.store.signClient = null;
    this.store.session = null;
    this.store.accountId = null;
  }
}

// Export singleton instance
export const hashPackSessionStore = new SessionStore();