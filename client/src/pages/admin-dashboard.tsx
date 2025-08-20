import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  LogOut,
  Eye,
  AlertTriangle
} from "lucide-react";

interface PendingRight {
  id: number;
  title: string;
  description: string;
  type: string;
  symbol: string;
  creatorId: number;
  verificationStatus: string;
  createdAt: string;
  price: string;
  currency: string;
  verificationFiles?: Array<{
    id: string;
    originalName: string;
    fileType: string;
    uploadedAt: string;
  }>;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRight, setSelectedRight] = useState<PendingRight | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  // Check admin authentication
  useEffect(() => {
    if (!localStorage.getItem("adminAuth")) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: pendingRights, isLoading } = useQuery<PendingRight[]>({
    queryKey: ["/api/admin/rights?status=pending"],
    queryFn: async () => {
      const response = await fetch("/api/admin/rights?status=pending");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  const verifyRightMutation = useMutation({
    mutationFn: async ({ rightId, status, notes }: { rightId: number; status: string; notes: string }) => {
      const response = await apiRequest("PUT", `/api/admin/rights/${rightId}/verify`, {
        status,
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rights?status=pending"] });
      setSelectedRight(null);
      setVerificationNotes("");
      toast({
        title: "Success",
        description: "Right verification updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminUser");
    setLocation("/admin/login");
  };

  const handleVerify = (status: "verified" | "rejected") => {
    if (!selectedRight) return;
    
    verifyRightMutation.mutate({
      rightId: selectedRight.id,
      status,
      notes: verificationNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">Back to Site</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Rights List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Pending Rights ({pendingRights?.length || 0})</h2>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                <Clock className="w-3 h-3 mr-1" />
                Awaiting Review
              </Badge>
            </div>

            <div className="space-y-3">
              {pendingRights && pendingRights.length > 0 ? (
                pendingRights.map((right) => (
                  <Card
                    key={right.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedRight?.id === right.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => setSelectedRight(right)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{right.symbol}</span>
                            <h3 className="font-semibold truncate">{right.title}</h3>
                            <Badge variant="secondary">{right.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {right.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>ID: {right.id}</span>
                            <span>{right.price} {right.currency}</span>
                            <span>{new Date(right.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No rights pending verification</p>
                </Card>
              )}
            </div>
          </div>

          {/* Right Details & Verification */}
          <div className="space-y-4">
            {selectedRight ? (
              <>
                <h2 className="text-2xl font-bold">Review Right #{selectedRight.id}</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">{selectedRight.symbol}</span>
                      {selectedRight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedRight.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <Badge variant="secondary" className="mt-1">
                          {selectedRight.type}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Price</label>
                        <p className="text-sm font-mono mt-1">
                          {selectedRight.price} {selectedRight.currency}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Submitted</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedRight.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {selectedRight.verificationFiles && selectedRight.verificationFiles.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Verification Files</label>
                        <div className="mt-2 space-y-2">
                          {selectedRight.verificationFiles.map((file) => (
                            <div key={file.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{file.originalName}</span>
                              <Badge variant="outline" className="text-xs">
                                {file.fileType}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Verification Notes</label>
                      <Textarea
                        placeholder="Add notes about your decision..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleVerify("verified")}
                        disabled={verifyRightMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleVerify("rejected")}
                        disabled={verifyRightMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Right Selected</h3>
                <p className="text-muted-foreground">
                  Select a right from the left panel to review and verify
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}