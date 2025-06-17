import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface MintingStatus {
  rightId: number;
  status: "processing" | "completed" | "error";
  currentStep: number;
  steps: Array<{
    id: string;
    title: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
  }>;
  results?: {
    tokenId: string;
    serialNumber: number;
    transactionId: string;
    metadataUri: string;
  };
  error?: string;
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
}

export function useMintingProgress(rightId: number) {
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: statusData, error: statusError } = useQuery({
    queryKey: [`/api/minting-status/${rightId}`],
    refetchInterval: isComplete ? false : 1000, // Poll every second until complete
    retry: false,
    enabled: !isComplete && !error
  });

  useEffect(() => {
    if (statusData) {
      const status = statusData as MintingStatus;
      
      if (status.status === "completed") {
        setIsComplete(true);
      } else if (status.status === "error") {
        setError(status.error || "Unknown error");
        setIsComplete(true);
      }
    }
  }, [statusData]);

  useEffect(() => {
    if (statusError) {
      setError("Failed to track minting progress");
      setIsComplete(true);
    }
  }, [statusError]);

  return {
    status: statusData as MintingStatus | null,
    isLoading: !statusData && !error,
    isComplete,
    error
  };
}