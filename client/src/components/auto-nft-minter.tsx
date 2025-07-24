import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hederaService, type RightMetadata, type NFTMintResult } from "@/lib/hederaSimple";
import type { RightWithCreator } from "@shared/schema";

interface AutoNFTMinterProps {
  rightId: number;
  onMintComplete?: (nftData: NFTMintResult) => void;
}

export function AutoNFTMinter({ rightId, onMintComplete }: AutoNFTMinterProps) {
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the right data to check verification status
  const { data: right, isLoading } = useQuery<RightWithCreator>({
    queryKey: [`/api/rights/${rightId}`],
    refetchInterval: 5000, // Check every 5 seconds for status updates
  });

  // Mutation to record NFT mint data
  const recordNFTMutation = useMutation({
    mutationFn: async (hederaData: NFTMintResult) => {
      return apiRequest("POST", `/api/rights/${rightId}/mint-nft`, { hederaData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rights/${rightId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rights"] });
      toast({
        title: "NFT Minted Successfully",
        description: "The right has been tokenized as an NFT on Ethereum blockchain.",
      });
    },
    onError: (error) => {
      console.error("Failed to record NFT mint:", error);
      toast({
        title: "Error Recording NFT",
        description: "NFT was minted but failed to record in database. Please contact support.",
        variant: "destructive",
      });
    },
  });

  // Auto-mint NFT when right becomes verified
  useEffect(() => {
    const attemptNFTMint = async () => {
      if (!right || right.verificationStatus !== "verified" || right.tokenId || isMinting) {
        return;
      }

      setIsMinting(true);

      try {
        toast({
          title: "Minting NFT",
          description: "Creating NFT on Ethereum blockchain for verified right...",
        });

        // Create metadata for the verified right
        const rightMetadata: RightMetadata = {
          title: right.title,
          description: right.description,
          type: right.type as "copyright" | "royalty" | "access" | "ownership" | "license",
          dividends: right.paysDividends || false,
          payout_address: right.paymentAddress || "0.0.123456", // Default payout address
          creator: "0.0.123456", // Would be actual user's Hedera account
          created_at: new Date().toISOString(),
        };

        // Mint NFT on Hedera
        const mintResult = await hederaService.mintRightNFT(rightMetadata);

        // Record the NFT data in the database
        await recordNFTMutation.mutateAsync({
          tokenId: mintResult.tokenId,
          serialNumber: mintResult.serialNumber,
          transactionId: mintResult.transactionId,
          metadataUri: mintResult.metadataUri,
          contractAddress: "0x1234567890123456789012345678901234567890", // Would be actual contract address
          network: "testnet",
        });

        if (onMintComplete) {
          onMintComplete(mintResult);
        }

      } catch (error) {
        console.error("NFT minting failed:", error);
        toast({
          title: "NFT Minting Failed",
          description: "Failed to mint NFT on Ethereum blockchain. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsMinting(false);
      }
    };

    attemptNFTMint();
  }, [right?.verificationStatus, right?.tokenId, rightId, isMinting]);

  // This component doesn't render anything visible
  return null;
}