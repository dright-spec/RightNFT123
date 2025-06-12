import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Users,
  Target,
  Lightbulb,
  Shield,
  Globe,
  TrendingUp,
  Heart,
  Twitter,
  Github,
  Linkedin,
  Mail
} from "lucide-react";

export default function About() {
  const teamMembers = [
    {
      name: "Alex Chen",
      role: "CEO & Co-Founder",
      bio: "Former tech lawyer turned blockchain entrepreneur. 10+ years in IP law.",
      avatar: "AC",
      social: { twitter: "#", linkedin: "#" }
    },
    {
      name: "Sarah Kim",
      role: "CTO & Co-Founder", 
      bio: "Ex-Spotify engineer. Expert in music streaming and royalty distribution.",
      avatar: "SK",
      social: { twitter: "#", github: "#" }
    },
    {
      name: "Marcus Johnson",
      role: "Head of Legal",
      bio: "Entertainment lawyer specializing in digital rights and blockchain compliance.",
      avatar: "MJ",
      social: { linkedin: "#" }
    },
    {
      name: "Elena Rodriguez",
      role: "Head of Product",
      bio: "Former product manager at YouTube Music. Passionate about creator empowerment.",
      avatar: "ER",
      social: { twitter: "#", linkedin: "#" }
    }
  ];

  const stats = [
    { label: "Rights Tokenized", value: "10,000+", icon: TrendingUp },
    { label: "Total Value Traded", value: "$2.5M", icon: Globe },
    { label: "Active Creators", value: "5,000+", icon: Users },
    { label: "Countries Supported", value: "50+", icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Democratizing Digital Rights
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We're building the infrastructure for a new economy where creators maintain ownership 
            and control over their intellectual property while enabling global, liquid markets for digital rights.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To create a transparent, efficient marketplace where creators can monetize their intellectual 
                property while maintaining control over income streams and distribution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle>Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A world where every creator has direct access to global capital markets for their intellectual 
                property, eliminating intermediaries and maximizing creator value.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Transparency, creator empowerment, legal compliance, and building sustainable value 
                for the entire creative economy ecosystem.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">Our Story</CardTitle>
            <CardDescription>How Dright came to be</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">The Problem We Saw</h3>
                <p className="text-muted-foreground">
                  As a tech lawyer working with musicians and content creators, Alex witnessed firsthand 
                  how broken the traditional rights management system was. Creators were losing millions 
                  to intermediaries, complex contracts, and opaque royalty systems.
                </p>
                <p className="text-muted-foreground">
                  Meanwhile, Sarah was building streaming infrastructure at Spotify and saw how technology 
                  could revolutionize rights distribution - but only if creators had direct control.
                </p>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3">Key Insights</h4>
                <ul className="space-y-2 text-sm">
                  <li>• 60% of streaming royalties lost to intermediaries</li>
                  <li>• Average 18-month delay in royalty payments</li>
                  <li>• No transparent marketplace for IP trading</li>
                  <li>• Creators locked into unfavorable long-term deals</li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="bg-primary/5 p-6 rounded-lg">
                <h4 className="font-semibold mb-3">Our Solution</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Direct creator-to-fan value transfer</li>
                  <li>• Real-time streaming payments via Superfluid</li>
                  <li>• Transparent marketplace with instant liquidity</li>
                  <li>• Legal compliance with ownership verification</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">The Solution We Built</h3>
                <p className="text-muted-foreground">
                  Dright combines blockchain technology with legal compliance to create the first 
                  truly transparent marketplace for digital rights. Creators maintain control over 
                  their income streams while gaining access to global liquidity.
                </p>
                <p className="text-muted-foreground">
                  We're not just another NFT platform - we're building the infrastructure for 
                  a new creative economy where value flows directly to creators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground">
              Experienced leaders from tech, law, and entertainment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg font-semibold">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {member.bio}
                  </p>
                  <div className="flex justify-center space-x-2">
                    {member.social.twitter && (
                      <Button size="sm" variant="outline" className="p-2">
                        <Twitter className="w-4 h-4" />
                      </Button>
                    )}
                    {member.social.linkedin && (
                      <Button size="sm" variant="outline" className="p-2">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                    )}
                    {member.social.github && (
                      <Button size="sm" variant="outline" className="p-2">
                        <Github className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Legal Notice */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Legal & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                Important Legal Notice
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Dright operates as a legal ownership transfer platform, not a securities exchange. 
                We facilitate the transfer of actual legal rights, not investment products. All 
                income streams remain under direct control of original rights owners via 
                decentralized payment protocols.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Regulatory Compliance</h4>
                <p className="text-muted-foreground">
                  Fully compliant with IP law and digital asset regulations in all operating jurisdictions.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Legal Framework</h4>
                <p className="text-muted-foreground">
                  Built on established intellectual property law with smart contract automation.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Creator Protection</h4>
                <p className="text-muted-foreground">
                  Comprehensive verification prevents fraud and protects legitimate rights holders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
            <CardDescription>
              Questions, partnerships, or just want to chat about the future of digital rights?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium mb-2">General Inquiries</h4>
                <p className="text-sm text-muted-foreground">hello@dright.com</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="font-medium mb-2">Partnerships</h4>
                <p className="text-sm text-muted-foreground">partners@dright.com</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-medium mb-2">Legal & Compliance</h4>
                <p className="text-sm text-muted-foreground">legal@dright.com</p>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              <Button variant="outline" size="sm">
                <Twitter className="w-4 h-4 mr-2" />
                Follow us
              </Button>
              <Button variant="outline" size="sm">
                <Github className="w-4 h-4 mr-2" />
                Open Source
              </Button>
              <Button variant="outline" size="sm">
                <Linkedin className="w-4 h-4 mr-2" />
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}