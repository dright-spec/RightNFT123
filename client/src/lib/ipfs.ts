import { apiRequest } from "./queryClient";

export interface IPFSUploadResult {
  hash: string;
  url: string;
  success: boolean;
  fileHash?: string; // SHA-256 hash of the file content
  fileSize?: number;
  fileName?: string;
  fileType?: string;
}

export async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadContentToIPFS(file: File): Promise<IPFSUploadResult> {
  try {
    // Generate content hash for verification
    const fileHash = await generateFileHash(file);
    
    // In production, this would upload to actual IPFS
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      hash: mockHash,
      url: `https://ipfs.io/ipfs/${mockHash}`,
      fileHash,
      fileSize: file.size,
      fileName: file.name,
      fileType: file.type,
      success: true,
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    return {
      hash: '',
      url: '',
      success: false,
    };
  }
}

export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  // In production, this would upload to actual IPFS
  // For now, we'll simulate the upload process
  
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        // Simulate API call to upload service
        const response = await apiRequest("POST", "/api/ipfs/upload", {
          filename: file.name,
          size: file.size,
          type: file.type,
        });
        
        const result = await response.json();
        resolve(result);
      } catch (error) {
        reject(new Error("Failed to upload to IPFS"));
      }
    }, 2000); // Simulate upload delay
  });
}

export async function uploadJSONToIPFS(data: any): Promise<IPFSUploadResult> {
  // Convert JSON to blob
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  
  const file = new File([jsonBlob], "metadata.json", {
    type: "application/json",
  });
  
  return uploadToIPFS(file);
}

export async function fetchFromIPFS(hash: string): Promise<any> {
  // In production, this would fetch from IPFS gateway
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock data based on hash
      if (hash.startsWith("QmMetadata")) {
        resolve({
          name: "Sample Right Metadata",
          description: "This is sample metadata for demonstration",
          attributes: [
            { trait_type: "Type", value: "Copyright" },
            { trait_type: "Pays Dividends", value: "Yes" },
          ],
        });
      } else {
        reject(new Error("Failed to fetch from IPFS"));
      }
    }, 1000);
  });
}

export function getIPFSGatewayUrl(hash: string): string {
  return `https://ipfs.io/ipfs/${hash}`;
}

export function isIPFSHash(hash: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash);
}
