import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, XSquare, FileText, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RightWithCreator {
  id: number;
  title: string;
  type: string;
  verificationStatus: string;
  createdAt: string;
  creator: {
    username: string;
  };
}

interface BulkActionsProps {
  rights: RightWithCreator[];
  selectedRights: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
}

export function BulkActions({ rights, selectedRights, onSelectionChange }: BulkActionsProps) {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkVerifyMutation = useMutation({
    mutationFn: async (data: { rightIds: number[]; notes: string }) =>
      apiRequest("/api/admin/bulk-verify", "POST", data),
    onSuccess: (data) => {
      toast({
        title: "Bulk Action Completed",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rights"] });
      onSelectionChange(new Set());
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(rights.map(r => r.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleBulkVerify = () => {
    if (selectedRights.size === 0) {
      toast({
        title: "No Rights Selected",
        description: "Please select rights to verify",
        variant: "destructive",
      });
      return;
    }

    bulkVerifyMutation.mutate({
      rightIds: Array.from(selectedRights),
      notes
    });
  };

  const selectedCount = selectedRights.size;
  const totalCount = rights.length;

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Bulk Actions
          </CardTitle>
          <CardDescription>
            Perform actions on multiple rights simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCount === totalCount && totalCount > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">
                Select All ({totalCount} rights)
              </span>
            </div>
            <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
              {selectedCount} selected
            </Badge>
          </div>

          {selectedCount > 0 && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Selected Rights:</span>
              </div>
              
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {Array.from(selectedRights).map(rightId => {
                  const right = rights.find(r => r.id === rightId);
                  return right ? (
                    <div key={rightId} className="flex items-center justify-between p-2 bg-background rounded text-xs">
                      <span className="truncate">{right.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {right.type}
                      </Badge>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Verification Notes</label>
                <Textarea
                  placeholder="Add notes for bulk verification (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBulkVerify}
                  disabled={bulkVerifyMutation.isPending}
                  className="flex-1"
                >
                  {bulkVerifyMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Verify Selected ({selectedCount})
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => onSelectionChange(new Set())}
                  disabled={bulkVerifyMutation.isPending}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {selectedCount === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select rights from the list below to enable bulk actions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Filters</CardTitle>
          <CardDescription>
            Common selection patterns for efficient bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const youtubeRights = rights
                  .filter(r => r.type === 'YouTube Video')
                  .map(r => r.id);
                onSelectionChange(new Set(youtubeRights));
              }}
            >
              YouTube Videos ({rights.filter(r => r.type === 'YouTube Video').length})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const musicRights = rights
                  .filter(r => r.type === 'Music Track')
                  .map(r => r.id);
                onSelectionChange(new Set(musicRights));
              }}
            >
              Music Tracks ({rights.filter(r => r.type === 'Music Track').length})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const oldRights = rights
                  .filter(r => {
                    const daysDiff = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                    return daysDiff > 7;
                  })
                  .map(r => r.id);
                onSelectionChange(new Set(oldRights));
              }}
            >
              Older than 7 days
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}