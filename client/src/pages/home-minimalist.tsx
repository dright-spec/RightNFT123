import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, DollarSign, Shield, Zap, ChevronRight, Youtube, Users, TrendingUp, Star } from "lucide-react";

export default function HomeMinimalist() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      text: "I never knew my YouTube videos could generate passive income. Made $2,400 in my first month!",
      author: "Sarah Chen",
      role: "YouTuber, 150K subscribers"
    },
    {
      text: "Sold my song rights for $15,000 instantly. No lawyers, no paperwork, just pure simplicity.",
      author: "Marcus Rodriguez",
      role: "Independent Musician"
    },
    {
      text: "My art photography now earns me monthly dividends. It's like having rental properties for creators.",
      author: "Emma Thompson",
      role: "Digital Artist"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg">Dright</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">Browse</Button>
            </Link>
            <Link href="/create-right">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
            <Zap className="w-3 h-3 mr-1" />
            Turn Your Creativity Into Cash
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">
            Sell Your Creative Rights
            <br />
            <span className="text-blue-600">In 3 Minutes</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Your YouTube videos, music, art, and ideas can generate passive income. 
            No contracts, no lawyers, no waiting. Just instant money from your creativity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/create-right">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
                <Play className="w-5 h-5 mr-2" />
                Start Making Money
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              <Youtube className="w-5 h-5 mr-2" />
              See How It Works
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>2,847 creators earning</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>$1.2M+ paid out</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Three simple steps to start earning from your creative work</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Connect Your Content</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Paste your YouTube video, upload your music, or share your artwork. We verify you own it in seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Set Your Price</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose how much you want to sell your rights for. Keep earning royalties or sell completely - your choice.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Get Paid Instantly</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Money hits your wallet the moment someone buys. No waiting, no fees, no complicated paperwork.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-8 md:p-12">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl font-medium mb-6 leading-relaxed">
              "{testimonials[currentTestimonial].text}"
            </blockquote>
            <cite className="text-gray-600 dark:text-gray-300">
              <div className="font-semibold">{testimonials[currentTestimonial].author}</div>
              <div className="text-sm">{testimonials[currentTestimonial].role}</div>
            </cite>
          </div>
        </div>
      </section>

      {/* What You Can Sell */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Can You Sell?</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Turn any creative work into income</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Youtube, title: "YouTube Videos", desc: "Copyright to your viral videos" },
              { icon: Play, title: "Music & Songs", desc: "Original tracks and compositions" },
              { icon: Star, title: "Digital Art", desc: "Photography and digital designs" },
              { icon: Shield, title: "Brand Rights", desc: "Logos, trademarks, and brands" }
            ].map((item, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all group cursor-pointer">
                <CardContent className="p-6 text-center">
                  <item.icon className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Safe & Secure</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-12">
            Built on blockchain technology with military-grade security
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Ownership Verified</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">We confirm you own everything before listing</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Instant Payments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Money transfers immediately on sale</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Global Marketplace</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Buyers from around the world</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Turn Your Creativity Into Cash?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators already earning passive income
          </p>
          <Link href="/create-right">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
              Start Selling Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm mt-4 opacity-75">No credit card required • Get started in under 3 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg">Dright</span>
          </div>
          <p className="text-gray-400 mb-6">Making creativity profitable for everyone</p>
          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/docs" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}