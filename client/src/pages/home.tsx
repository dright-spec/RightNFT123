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
              <Link href="/auctions" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Auctions
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
              Legal Ownership Tools.<br />
              <span className="text-gradient">Not Investment Products.</span>
            </h1>
            
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Digital marketplace for trading legal rights as NFTs. Owners control their income streams directly through verified ownership transfers.
            </p>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg max-w-4xl mx-auto">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium text-center">
                <strong>Important:</strong> This is a legal ownership tool, not an investment product. Rights trading does not guarantee returns or price appreciation.
              </p>
            </div>

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

      {/* Rights Types Section */}
      <section className="py-20 bg-gradient-to-br from-muted/30 via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">What Rights Can You Tokenize?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Turn any legal right with revenue potential into tradeable NFTs. Here's what you can start with today.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {/* Music Rights */}
            <Card className="p-6 rights-card-hover group border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Music className="w-8 h-8 text-primary" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <h3 className="text-xl font-semibold text-primary">Music Rights</h3>
                  <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                </div>
                <p className="text-muted-foreground mb-4 text-center">
                  Legal ownership of music streaming and performance rights
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Spotify/Apple Music streaming royalties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Radio play and performance earnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Movie/TV sync licensing fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>YouTube monetization rights</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Example:</strong> Legal transfer of 10% streaming rights - owner receives 10% of royalty distributions through direct payment streams.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Patents */}
            <Card className="p-6 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Patent Rights</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Legal ownership transfer of patent licensing rights
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Technology patent licensing deals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Manufacturing and production rights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Software algorithm royalties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Medical device licensing income</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <strong>Example:</strong> Legal transfer of patent licensing rights - new owner receives licensing fees directly from manufacturers.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Real Estate */}
            <Card className="p-6 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Real Estate Rights</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Legal transfer of fractional property ownership rights
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Rental income distribution rights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Ownership transfer documentation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Commercial lease agreement rights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Development and zoning rights transfer</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    <strong>Example:</strong> Legal transfer of 5% property ownership - new owner receives rental distributions through direct payment streams.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Copyrights */}
            <Card className="p-6 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Copyright Assets</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Legal ownership transfer of creative work licensing rights
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Book publishing and distribution rights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Film and TV adaptation deals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Art reproduction and licensing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Software and code licensing</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    <strong>Example:</strong> License your artwork for merchandise and earn royalties on every product sold.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Access Rights */}
            <Card className="p-6 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Access Rights</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Exclusive access and membership benefits as assets
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>VIP event and concert access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Premium content and courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Platform membership privileges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Exclusive community benefits</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg">
                  <p className="text-xs text-teal-700 dark:text-teal-300">
                    <strong>Example:</strong> Sell VIP backstage access to your concerts as tradeable NFTs with resale value.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trademark Rights */}
            <Card className="p-6 rights-card-hover group">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Star className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Trademark & Brand Rights</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Monetize brand names, logos, and trademark assets
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Brand name licensing deals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Logo and design usage rights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Franchise and partnership income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Merchandise and product rights</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    <strong>Example:</strong> License your brand name to other businesses and earn royalties on their revenue.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">How Dright Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform any legal right into liquid, tradeable assets with transparent revenue distribution.
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
