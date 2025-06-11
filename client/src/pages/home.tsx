import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateRightModal } from "@/components/create-right-modal";
import { WalletButton } from "@/components/wallet-button";
import { RightCard } from "@/components/right-card";
import { Plus, Search, FileText, DollarSign, Shield, Check, X, Music, TrendingUp, Zap, Users, Globe, ArrowRight, Sparkles, Star } from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: featuredRights, isLoading } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", { limit: 6, isListed: true }],
  });

  const scrollToMarketplace = () => {
    document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary">
                  D<span className="text-accent">right</span>
                </h1>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Marketplace
              </Link>
              <a href="#docs" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Docs
              </a>
              <a href="#about" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                About
              </a>
            </nav>

            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Floating Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <Music className="absolute top-20 left-10 w-8 h-8 text-primary/20 animate-float" />
              <Globe className="absolute top-32 right-16 w-6 h-6 text-accent/20 animate-float-delayed" />
              <TrendingUp className="absolute bottom-20 left-20 w-7 h-7 text-primary/20 animate-float" />
              <Sparkles className="absolute top-16 right-32 w-5 h-5 text-accent/20 animate-pulse-slow" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Now Supporting All Rights Types
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight relative z-10">
              Tokenize Your Rights.<br />
              <span className="text-gradient">Make Them Liquid.</span>
            </h1>
            
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform any legal right into tradeable NFTs. From music streaming rights to patents, real estate shares to trademarks - make any valuable right instantly liquid.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold h-auto shadow-lg hover:scale-105 transition-all glow-primary relative overflow-hidden"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="absolute inset-0 shimmer"></div>
                <Plus className="w-6 h-6 mr-2 relative z-10" />
                <span className="relative z-10">Create a Right</span>
                <ArrowRight className="w-4 h-4 ml-2 relative z-10" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold h-auto glass-card hover:bg-primary/5 transition-all"
                onClick={scrollToMarketplace}
              >
                <Search className="w-6 h-6 mr-2" />
                Explore Rights
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-primary">$2.4M+</div>
                <div className="text-sm text-muted-foreground">Rights Tokenized</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-accent">150+</div>
                <div className="text-sm text-muted-foreground">Active Rights</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Community Members</div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-10 w-20 h-20 bg-accent/20 rounded-full animate-float-delayed"></div>
      </section>

      {/* Explainer Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">How Dright Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform any legal right into liquid, tradeable assets. Music rights, patents, real estate, trademarks - all become instantly tradeable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gradient">Upload Your Rights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload legal documents and specify the type of right you want to tokenize. Music rights, patents, real estate - we support them all.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gradient">Mint as NFT</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We create an NFT representing your right with smart contracts that automatically handle dividend distributions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gradient">Trade & Earn</h3>
                <p className="text-muted-foreground leading-relaxed">
                  List your rights on our marketplace, collect dividends automatically, and trade with other investors worldwide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Rights Section */}
      <section id="marketplace" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Featured Rights</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover trending music rights, valuable patents, real estate shares, and other tokenized assets available for investment.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredRights?.map((right) => (
                <RightCard key={right.id} right={right} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/marketplace">
              <Button size="lg" className="px-8 py-3 font-semibold">
                Browse Full Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-8">Built on trusted technology</h3>
          
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">Ξ</span>
              </div>
              <span className="font-medium text-muted-foreground">Ethereum</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">IP</span>
              </div>
              <span className="font-medium text-muted-foreground">IPFS</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">721</span>
              </div>
              <span className="font-medium text-muted-foreground">ERC-721</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">SF</span>
              </div>
              <span className="font-medium text-muted-foreground">Superfluid</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                D<span className="text-green-400">right</span>
              </h3>
              <p className="text-gray-400">
                Tokenize, trade, and earn from your music with transparent smart contracts and streaming royalties.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><a href="#create" className="hover:text-white transition-colors">Create Rights</a></li>
                <li><a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#support" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#legal" className="hover:text-white transition-colors">Legal</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#twitter" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#discord" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#github" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 RightsMarket. All rights reserved.</p>
            <div className="mt-4 sm:mt-0">
              <span className="text-sm text-gray-400">Wallet: Not connected</span>
            </div>
          </div>
        </div>
      </footer>

      <CreateRightModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
