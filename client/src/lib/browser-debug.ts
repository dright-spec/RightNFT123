// Debug utility to check what wallet objects are available in the browser
export function debugBrowserWallets() {
  if (typeof window === 'undefined') {
    return { available: [], message: 'Server-side rendering' }
  }

  const walletObjects = []
  const windowObj = window as any

  // Check for common wallet objects
  const walletChecks = [
    { name: 'hashpack', key: 'hashpack' },
    { name: 'HashPack', key: 'HashPack' },
    { name: 'hashconnect', key: 'hashconnect' },
    { name: 'HashConnect', key: 'HashConnect' },
    { name: 'ethereum', key: 'ethereum' },
    { name: 'web3', key: 'web3' },
    { name: 'solana', key: 'solana' },
    { name: 'phantom', key: 'phantom' },
    { name: 'hc', key: 'hc' },
    { name: 'hedera', key: 'hedera' },
    { name: 'onhashchange', key: 'onhashchange' }
  ]

  for (const check of walletChecks) {
    if (windowObj[check.key]) {
      walletObjects.push({
        name: check.name,
        type: typeof windowObj[check.key],
        methods: Object.getOwnPropertyNames(windowObj[check.key]).filter(prop => 
          typeof windowObj[check.key][prop] === 'function'
        ),
        properties: Object.getOwnPropertyNames(windowObj[check.key]).filter(prop => 
          typeof windowObj[check.key][prop] !== 'function'
        )
      })
    }
  }

  // Check for any objects containing 'hash' or 'pack'
  const allWindowKeys = Object.keys(windowObj)
  const hashPackRelated = allWindowKeys.filter(key => 
    key.toLowerCase().includes('hash') || 
    key.toLowerCase().includes('pack') ||
    key.toLowerCase().includes('hedera')
  )

  // Deep scan for HashPack-related objects
  const deepScan: any = {}
  hashPackRelated.forEach(key => {
    const obj = windowObj[key]
    if (obj && typeof obj === 'object') {
      deepScan[key] = {
        type: typeof obj,
        isFunction: typeof obj === 'function',
        keys: Object.keys(obj),
        methods: Object.keys(obj).filter(prop => typeof obj[prop] === 'function'),
        hasConnect: typeof obj.connect === 'function',
        hasInit: typeof obj.init === 'function'
      }
    } else {
      deepScan[key] = { type: typeof obj, value: obj }
    }
  })

  // Also scan for wallet objects that might contain HashPack
  const walletProviders: any = {}
  if (windowObj.ethereum) {
    walletProviders.ethereum = {
      isHashPack: !!windowObj.ethereum.isHashPack,
      isMetaMask: !!windowObj.ethereum.isMetaMask,
      providers: windowObj.ethereum.providers || [],
      selectedProvider: windowObj.ethereum.selectedProvider,
      keys: Object.keys(windowObj.ethereum)
    }
  }

  return {
    available: walletObjects,
    hashPackRelated,
    deepScan,
    walletProviders,
    allWindowKeys: allWindowKeys.length,
    message: walletObjects.length > 0 ? 'Found wallet objects' : 'No wallet objects found'
  }
}

// Check specifically for HashPack extension
export function checkHashPackExtension() {
  if (typeof window === 'undefined') return false

  const windowObj = window as any
  
  // Multiple ways HashPack might be exposed
  const hashPackChecks = [
    windowObj.hashpack,
    windowObj.HashPack,
    windowObj.hashconnect,
    windowObj.HashConnect,
    windowObj.hc,
    windowObj.hedera?.hashpack,
    windowObj.ethereum?.isHashPack
  ]

  const foundMethods = []
  
  for (let i = 0; i < hashPackChecks.length; i++) {
    const obj = hashPackChecks[i]
    if (obj) {
      foundMethods.push({
        index: i,
        type: typeof obj,
        hasConnect: typeof obj.connect === 'function',
        hasInit: typeof obj.init === 'function',
        hasPair: typeof obj.pair === 'function',
        keys: Object.keys(obj)
      })
    }
  }

  return {
    found: foundMethods.length > 0,
    methods: foundMethods,
    extensionDetected: !!windowObj.hashpack || !!windowObj.HashPack
  }
}