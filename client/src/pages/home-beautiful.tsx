import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedRightGrid } from "@/components/animated-right-card";
import { 
  Play, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  TrendingUp, 
  Users, 
  Globe, 
  Star,
  Youtube,
  Music,
  Palette,
  Crown,
  Zap,
  CheckCircle,
  DollarSign,
  Lock,
  Eye,
  Heart,
  Infinity
} from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

export default function HomeBeautiful() {
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const { data: featuredRights, isLoading } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", { limit: 6, isListed: true }],
  });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "Your intellectual property is protected by blockchain technology and smart contracts",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "Instant Liquidity",
      description: "Transform illiquid creative assets into tradeable investments within minutes",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Globe,
      title: "Global Marketplace",
      description: "Sell to investors worldwide with automatic payments and transparent transactions",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  const stats = [
    { value: "$2.4M+", label: "Rights Tokenized", icon: DollarSign },
    { value: "12,000+", label: "Active Creators", icon: Users },
    { value: "98.7%", label: "Success Rate", icon: CheckCircle },
    { value: "24/7", label: "Global Trading", icon: Globe }
  ];

  const contentTypes = [
    {
      icon: Youtube,
      title: "YouTube Videos",
      description: "Monetize your viral content",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20"
    },
    {
      icon: Music,
      title: "Music & Audio",
      description: "Royalties from your tracks",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      icon: Palette,
      title: "Digital Art",
      description: "Photography & designs",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      icon: Crown,
      title: "Brand Rights",
      description: "Trademarks & logos",
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/20"
    }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-blue-200/50 dark:border-blue-800/50 shadow-lg mb-8 animate-float">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Trusted by 12,000+ Creators Worldwide
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                Turn Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                Creativity Into
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Investment Gold
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              The world's most beautiful platform for tokenizing intellectual property. 
              Transform your YouTube videos, music, and digital art into liquid assets 
              that generate passive income forever.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/create-right">
                <Button size="lg" className="text-lg px-8 py-4 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group">
                  <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Start Earning Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-14 border-2 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <Eye className="w-5 h-5 mr-2" />
                See How It Works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="py-24 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Infinity className="w-4 h-4 mr-2" />
              Unlimited Possibilities
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                What Can You Tokenize?
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Turn any creative work into a revenue-generating asset with our advanced tokenization platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contentTypes.map((type, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-105 hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${type.bgColor} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <type.icon className={`w-8 h-8 ${type.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                    {type.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Interactive Elements */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                Why Creators Choose Dright
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group cursor-pointer transition-all duration-500 border-0 ${
                  activeFeature === index ? 'scale-105 shadow-2xl' : 'hover:scale-102'
                } bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm`}
                onClick={() => setActiveFeature(index)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rights Section */}
      {featuredRights && featuredRights.length > 0 && (
        <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
                <Star className="w-4 h-4 mr-2" />
                Trending Now
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                  Featured Investments
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Discover high-performing rights generating passive income for investors
              </p>
            </div>

            <AnimatedRightGrid rights={featuredRights} variant="featured" />

            <div className="text-center mt-12">
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
                  Explore Full Marketplace
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white mb-8">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Join 12,000+ Happy Creators</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Monetize Your Creativity?
          </h2>
          <p className="text-xl text-white/90 mb-12 leading-relaxed">
            Start generating passive income from your intellectual property today. 
            No technical knowledge required - we handle everything for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-right">
              <Button size="lg" className="text-lg px-8 py-4 h-14 bg-white text-blue-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group">
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Create Your First Right
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-14 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
              <Lock className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
          
          <p className="text-sm text-white/70 mt-6">
            Free to start • No credit card required • 5-minute setup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 dark:bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-2xl font-bold">Dright</span>
          </div>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            The world's most beautiful platform for tokenizing creativity. 
            Built with love for creators, designed for the future of digital ownership.
          </p>
          <div className="flex justify-center gap-8 text-sm text-slate-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/docs" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}