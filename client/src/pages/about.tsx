import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  ArrowRight,
  DollarSign,
  FileText,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Scale,
  Zap,
  TrendingDown,
  TrendingUp,
  Users,
  Globe,
  Sparkles,
  Calculator,
  Target,
  Award
} from "lucide-react";

export default function About() {
  const costComparison = [
    {
      traditional: "$15,000 - $50,000",
      blockchain: "$25 - $100",
      item: "Music Licensing Agreement",
      timeTraditional: "4-8 weeks",
      timeBlockchain: "5 minutes"
    },
    {
      traditional: "$25,000 - $75,000",
      blockchain: "$50 - $150",
      item: "Film Rights Transfer",
      timeTraditional: "8-16 weeks",
      timeBlockchain: "10 minutes"
    },
    {
      traditional: "$10,000 - $30,000",
      blockchain: "$20 - $75",
      item: "Software Licensing",
      timeTraditional: "6-12 weeks",
      timeBlockchain: "3 minutes"
    },
    {
      traditional: "$20,000 - $60,000",
      blockchain: "$30 - $120",
      item: "Brand Licensing Deal",
      timeTraditional: "10-20 weeks",
      timeBlockchain: "7 minutes"
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "95% Cost Reduction",
      description: "Replace expensive legal fees with standardized blockchain contracts",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      icon: Clock,
      title: "99% Time Savings",
      description: "Complete rights transfers in minutes instead of months",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      icon: Shield,
      title: "Legal Certainty",
      description: "Smart contracts ensure automatic execution and compliance",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Instant worldwide distribution without geographic barriers",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    }
  ];

  const problemStats = [
    { label: "Average Legal Fees", value: "$35K", subtext: "per rights transfer", icon: TrendingUp },
    { label: "Time to Complete", value: "12 weeks", subtext: "with lawyers", icon: Clock },
    { label: "Success Rate", value: "67%", subtext: "deals fall through", icon: AlertTriangle },
    { label: "Hidden Costs", value: "$8K", subtext: "in revisions", icon: FileText }
  ];

  const solutionStats = [
    { label: "Platform Fee", value: "$75", subtext: "average cost", icon: DollarSign },
    { label: "Completion Time", value: "5 min", subtext: "fully automated", icon: Zap },
    { label: "Success Rate", value: "99.8%", subtext: "guaranteed execution", icon: CheckCircle },
    { label: "Revisions", value: "$0", subtext: "standardized templates", icon: Award }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40 backdrop-blur-md bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary">
                About D<span className="text-accent">right</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Problem-focused */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full text-red-700 dark:text-red-400 text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4" />
            Legal Industry Crisis
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Why Pay $35,000 in Legal Fees?
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed">
            Traditional rights transfers require armies of lawyers, months of negotiations, and massive legal fees. 
            Our blockchain platform standardizes the entire process, reducing costs by <span className="font-bold text-green-600">95%</span> and 
            completion time by <span className="font-bold text-blue-600">99%</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/create-right">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Start Saving Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 hover:bg-primary/5">
                Explore Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {/* Problem vs Solution Stats */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Traditional Problem */}
          <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-red-700 dark:text-red-400">Traditional Legal Process</CardTitle>
                  <CardDescription className="text-red-600/80">Expensive, slow, uncertain</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {problemStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-white/50 dark:bg-gray-900/20 rounded-lg border border-red-200/50">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <stat.icon className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stat.value}</div>
                    <div className="text-sm text-red-600/80">{stat.label}</div>
                    <div className="text-xs text-red-500/60">{stat.subtext}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Solution */}
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-green-700 dark:text-green-400">Dright Blockchain Solution</CardTitle>
                  <CardDescription className="text-green-600/80">Fast, affordable, guaranteed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {solutionStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-white/50 dark:bg-gray-900/20 rounded-lg border border-green-200/50">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <stat.icon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stat.value}</div>
                    <div className="text-sm text-green-600/80">{stat.label}</div>
                    <div className="text-xs text-green-500/60">{stat.subtext}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Comparison Table */}
        <Card className="mb-20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="text-center">
              <CardTitle className="text-3xl mb-2">Real Cost Comparison</CardTitle>
              <CardDescription className="text-lg">See how much you can save on actual rights transfers</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-6 font-semibold">Rights Transfer Type</th>
                    <th className="text-center p-6 font-semibold text-red-600">Traditional Cost</th>
                    <th className="text-center p-6 font-semibold text-green-600">Dright Cost</th>
                    <th className="text-center p-6 font-semibold text-blue-600">Time Saved</th>
                    <th className="text-center p-6 font-semibold text-purple-600">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {costComparison.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-muted/20 transition-colors">
                      <td className="p-6 font-medium">{item.item}</td>
                      <td className="p-6 text-center">
                        <div className="text-lg font-bold text-red-600">{item.traditional}</div>
                        <div className="text-sm text-muted-foreground">{item.timeTraditional}</div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="text-lg font-bold text-green-600">{item.blockchain}</div>
                        <div className="text-sm text-muted-foreground">{item.timeBlockchain}</div>
                      </td>
                      <td className="p-6 text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          -99%
                        </Badge>
                      </td>
                      <td className="p-6 text-center">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                          Up to 99.8%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Benefits Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Blockchain-Based Rights?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our standardized smart contracts eliminate the need for expensive custom legal work
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${benefit.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon className={`w-8 h-8 ${benefit.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <Card className="mb-20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
            <CardTitle className="text-3xl text-center">How Dright Eliminates Legal Costs</CardTitle>
            <CardDescription className="text-center text-white/90 text-lg">
              Three simple steps replace months of legal negotiations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-3xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Upload & Verify</h3>
                <p className="text-muted-foreground">
                  Submit your content and ownership proof. Our AI instantly verifies authenticity - no lawyers needed.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <span className="text-3xl font-bold text-accent">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Contract Deploy</h3>
                <p className="text-muted-foreground">
                  Standardized contract templates automatically generate legal agreements - no custom drafting required.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
                  <span className="text-3xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Trading</h3>
                <p className="text-muted-foreground">
                  Rights become immediately tradeable on our marketplace - liquidity without legal complexity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-World Impact */}
        <Card className="mb-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="text-center">
              <CardTitle className="text-4xl text-blue-700 dark:text-blue-400 mb-4">The World We're Building</CardTitle>
              <CardDescription className="text-xl text-blue-600/80 max-w-4xl mx-auto">
                Imagine a world where creators can instantly monetize their work globally, without expensive intermediaries
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">For Individual Creators</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Instant Global Access</p>
                      <p className="text-sm text-muted-foreground">Upload your music, art, or content and immediately reach buyers worldwide - no record labels or galleries needed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Keep 95% of Revenue</p>
                      <p className="text-sm text-muted-foreground">Traditional platforms take 30-70% cuts. Our blockchain system lets you keep almost everything you earn</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">No More Waiting for Payments</p>
                      <p className="text-sm text-muted-foreground">Get paid instantly when someone buys your rights - no 3-month payment delays from streaming platforms</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">For the Creative Economy</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">$2 Trillion Market Unlock</p>
                      <p className="text-sm text-muted-foreground">Most creative assets are illiquid. Blockchain makes them tradeable, creating massive new markets</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Fair Compensation for All</p>
                      <p className="text-sm text-muted-foreground">Transparent royalty distribution ensures everyone who contributes to creative work gets paid fairly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Democratic Creative Funding</p>
                      <p className="text-sm text-muted-foreground">Fans can directly invest in creators they believe in, democratizing who gets funding for creative projects</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <div className="text-center">
                <h4 className="text-2xl font-bold mb-4">The Bottom Line</h4>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  We're not just building another platform - we're creating the infrastructure for a new creative economy where 
                  talent and value flow directly between creators and supporters, without extractive middlemen taking most of the value.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="text-center bg-gradient-to-r from-primary to-accent text-white overflow-hidden relative">
          <CardContent className="p-12 relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to Revolutionize Your Rights Management?</h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join thousands of creators who've already saved millions in legal fees by switching to blockchain-based rights management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-right">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-lg">
                  Start Your First Transfer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="ghost" className="border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-8 py-4 text-lg backdrop-blur-sm">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 text-white/80">
              <p className="text-sm">✓ No setup fees • ✓ Pay only when you transact • ✓ 24/7 support</p>
            </div>
          </CardContent>
          
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-20"></div>
        </Card>
      </div>
    </div>
  );
}