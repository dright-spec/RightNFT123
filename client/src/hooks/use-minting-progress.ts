import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface MintingStep {
  id: string;
  title: string;
  status: "pending" | "processing" | "completed" | "error";
  startedAt?: string;
  completedAt?: string;
}

interface MintingStatus {
  rightId: number;
  status: "processing" | "completed" | "error";
  currentStep: number;
  steps: MintingStep[];
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  results?: {
    contractAddress: string;
    tokenId: string;
    transactionHash: string;
    metadataUri: string;
    explorerUrl: string;
    mintedAt: string;
    status: string;
  };
}

export function useMintingProgress(rightId: number) {
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: status, isLoading, error: queryError } = useQuery<MintingStatus>({
    queryKey: [`/api/minting-status/${rightId}`],
    refetchInterval: (data) => {
      // Stop polling if completed or failed
      if (data?.status === "completed" || data?.status === "error") {
        return false;
      }
      // Poll every 2 seconds while in progress
      return 2000;
    },
    retry: 3,
    staleTime: 1000, // Consider data stale after 1 second
  });

  useEffect(() => {
    if (status?.status === "completed") {
      setIsComplete(true);
    } else if (status?.status === "error") {
      setError(status.error || "Minting failed");
    }
  }, [status]);

  useEffect(() => {
    if (queryError) {
      setError("Failed to fetch minting status");
    }
  }, [queryError]);

  return {
    status,
    isLoading,
    isComplete,
    error,
  };
}