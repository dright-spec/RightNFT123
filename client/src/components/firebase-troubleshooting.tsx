import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";

interface FirebaseTroubleshootingProps {
  onSkip?: () => void;
}

export function FirebaseTroubleshooting({ onSkip }: FirebaseTroubleshootingProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const troubleshootingSteps = [
    {
      id: "auth-enabled",
      title: "Enable Google Authentication",
      description: "Go to Firebase Console > Authentication > Sign-in method > Google > Enable",
      status: "pending"
    },
    {
      id: "authorized-domains",
      title: "Add Authorized Domains", 
      description: "Add *.replit.dev, *.replit.app, localhost to authorized domains",
      status: "pending"
    },
    {
      id: "web-app",
      title: "Verify Web App Configuration",
      description: "Ensure your web app is properly configured with correct API keys",
      status: "pending"
    },
    {
      id: "api-restrictions",
      title: "Check API Key Restrictions",
      description: "Verify API key has no HTTP referrer restrictions that block your domain",
      status: "pending"
    }
  ];

  const handleCheck = (stepId: string) => {
    setCheckedItems(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Firebase Authentication Setup Required
        </CardTitle>
        <CardDescription>
          Complete these steps in your Firebase Console to enable Google authentication for YouTube verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            The Firebase project needs proper configuration to enable Google sign-in for YouTube video verification.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {troubleshootingSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCheck(step.id)}
                className={`mt-1 ${checkedItems.includes(step.id) ? 'bg-green-50 border-green-200' : ''}`}
              >
                {checkedItems.includes(step.id) ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </Button>
              <div className="flex-1">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('https://console.firebase.google.com', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Firebase Console
          </Button>
          
          {onSkip && (
            <Button variant="secondary" onClick={onSkip}>
              Skip for Now
            </Button>
          )}
        </div>

        <Alert>
          <AlertDescription>
            After completing these steps, refresh the page and try Google sign-in again.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}