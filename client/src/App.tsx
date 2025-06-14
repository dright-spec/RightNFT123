import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="border-b border-gray-800 px-6 py-4">
          <h1 className="text-2xl font-bold">Dright NFT Marketplace</h1>
          <p className="text-gray-400 mt-2">Tokenize and trade legal rights as NFTs on Hedera</p>
        </header>
        
        <main className="container mx-auto px-6 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Marketplace</h2>
              <p className="text-gray-400 mb-4">Browse and purchase verified legal rights</p>
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Explore Rights
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Create Rights</h2>
              <p className="text-gray-400 mb-4">Tokenize your intellectual property</p>
              <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                Create NFT
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Auctions</h2>
              <p className="text-gray-400 mb-4">Participate in live bidding</p>
              <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                View Auctions
              </button>
            </div>
          </div>
          
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Platform Features</h2>
            <ul className="space-y-2 text-gray-400">
              <li>• Hedera blockchain integration for secure NFT minting</li>
              <li>• YouTube content verification system</li>
              <li>• Built-in royalty distribution</li>
              <li>• Advanced wallet support (HashPack, Blade)</li>
              <li>• IPFS metadata storage</li>
            </ul>
          </div>
        </main>
        
        <footer className="border-t border-gray-800 px-6 py-4 mt-12">
          <p className="text-center text-gray-400">
            Dright NFT Marketplace - Powered by Hedera Hashgraph
          </p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
