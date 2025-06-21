import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestCredentials {
  message: string;
  credentials: {
    username: string;
    password: string;
  };
  note: string;
}

export function AdminCredentialsBanner() {
  const [showCredentials, setShowCredentials] = useState(false);
  const { toast } = useToast();

  const { data: credentials } = useQuery<TestCredentials>({
    queryKey: ["/api/admin/test-credentials"],
    retry: false,
  });

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`,
    });
  };

  if (!credentials) return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Live Test Credentials - Ready to Use
              </h3>
              <Badge variant="outline" className="border-green-600 text-green-700">
                Working
              </Badge>
            </div>
            
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              {credentials.note}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200 w-20">
                  Username:
                </span>
                <code className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
                  {credentials.credentials.username}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.credentials.username, 'Username')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200 w-20">
                  Password:
                </span>
                <code className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
                  {showCredentials ? credentials.credentials.password : '••••••••'}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCredentials(!showCredentials)}
                >
                  {showCredentials ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.credentials.password, 'Password')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}