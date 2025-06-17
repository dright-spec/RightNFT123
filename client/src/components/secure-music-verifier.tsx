import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  CheckCircle, 
  Music, 
  Shield, 
  FileAudio,
  AlertTriangle,
  Hash,
  Eye,
  Clock,
  Star,
  ExternalLink,
  Camera
} from "lucide-react";

interface OwnershipProof {
  type: 'copyright_certificate' | 'distributor_agreement' | 'publishing_contract' | 'creation_evidence';
  file: File;
  description: string;
}

interface MusicVerificationData {
  trackTitle: string;
  artistName: string;
  albumName?: string;
  releaseDate?: string;
  audioFile: File;
  audioHash: string;
  ownershipProofs: OwnershipProof[];
  verificationMethod: 'manual_review';
  confidence: 'pending_review';
  selfDeclaration: boolean;
}

interface SecureMusicVerifierProps {
  onComplete: (data: MusicVerificationData) => void;
  onBack: () => void;
}

export default function SecureMusicVerifier({ onComplete, onBack }: SecureMusicVerifierProps) {
  const [step, setStep] = useState<"info" | "upload" | "proof" | "confirm">("info");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioHash, setAudioHash] = useState<string>("");
  const [trackInfo, setTrackInfo] = useState({
    trackTitle: "",
    artistName: "",
    albumName: "",
    releaseDate: ""
  });
  const [ownershipProofs, setOwnershipProofs] = useState<OwnershipProof[]>([]);
  const [selfDeclaration, setSelfDeclaration] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const generateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      
      // Generate hash for blockchain storage
      setIsHashing(true);
      try {
        const hash = await generateFileHash(file);
        setAudioHash(hash);
      } catch (error) {
        console.error('Failed to generate hash:', error);
      }
      setIsHashing(false);
    }
  };

  const handleProofUpload = (event: React.ChangeEvent<HTMLInputElement>, proofType: OwnershipProof['type']) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const proof: OwnershipProof = {
          type: proofType,
          file,
          description: getProofDescription(proofType)
        };
        setOwnershipProofs(prev => [...prev, proof]);
      });
    }
  };

  const getProofDescription = (type: OwnershipProof['type']): string => {
    switch (type) {
      case 'copyright_certificate':
        return 'Official copyright registration certificate';
      case 'distributor_agreement':
        return 'Music distributor agreement or dashboard screenshot';
      case 'publishing_contract':
        return 'Publishing or record label contract';
      case 'creation_evidence':
        return 'Evidence of creation (studio photos, timestamps, etc.)';
      default:
        return 'Ownership documentation';
    }
  };

  const removeProof = (index: number) => {
    setOwnershipProofs(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (!audioFile || !audioHash || ownershipProofs.length === 0 || !selfDeclaration) return;

    const verificationData: MusicVerificationData = {
      trackTitle: trackInfo.trackTitle,
      artistName: trackInfo.artistName,
      albumName: trackInfo.albumName,
      releaseDate: trackInfo.releaseDate,
      audioFile,
      audioHash,
      ownershipProofs,
      verificationMethod: 'manual_review',
      confidence: 'pending_review',
      selfDeclaration
    };

    onComplete(verificationData);
  };

  if (step === "info") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Secure Music Ownership Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>Ownership verification required:</strong> To protect against copyright infringement, 
              we require proof of ownership before tokenizing any music. All submissions undergo manual review.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="font-medium">What you'll need to provide:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h5 className="font-medium">Your original audio file</h5>
                  <p className="text-sm text-muted-foreground">
                    The master recording you want to tokenize (will be hashed for blockchain storage)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h5 className="font-medium">Proof of ownership</h5>
                  <p className="text-sm text-muted-foreground">
                    Documentation proving you own the rights (see accepted documents below)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h5 className="font-medium">Manual review process</h5>
                  <p className="text-sm text-muted-foreground">
                    Our team will verify your ownership before approving the NFT creation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Accepted ownership documents:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Copyright registration certificates</li>
              <li>• Music distributor agreements (DistroKid, CD Baby, etc.)</li>
              <li>• Publishing or record label contracts</li>
              <li>• Studio session documentation with timestamps</li>
              <li>• ISRC/UPC registration documents</li>
            </ul>
          </div>

          <Alert>
            <Clock className="w-4 h-4" />
            <AlertDescription>
              <strong>Review time:</strong> Manual verification typically takes 1-3 business days. 
              You'll receive an email notification when your submission is reviewed.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button 
              onClick={() => setStep("upload")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Continue with Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "upload") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5" />
            Upload Your Audio File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Track Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trackTitle">Track Title *</Label>
              <Input
                id="trackTitle"
                value={trackInfo.trackTitle}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, trackTitle: e.target.value }))}
                placeholder="Enter track title"
              />
            </div>
            <div>
              <Label htmlFor="artistName">Artist Name *</Label>
              <Input
                id="artistName"
                value={trackInfo.artistName}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, artistName: e.target.value }))}
                placeholder="Enter artist name"
              />
            </div>
            <div>
              <Label htmlFor="albumName">Album/Single Name</Label>
              <Input
                id="albumName"
                value={trackInfo.albumName}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, albumName: e.target.value }))}
                placeholder="Enter album name (optional)"
              />
            </div>
            <div>
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input
                id="releaseDate"
                type="date"
                value={trackInfo.releaseDate}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, releaseDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Audio Upload */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Upload your original audio file</Label>
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => audioInputRef.current?.click()}
            >
              {audioFile ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Music className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{audioFile.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {(audioFile.size / 1024 / 1024).toFixed(1)} MB • {audioFile.type}
                    </p>
                    {isHashing && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Hash className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generating blockchain hash...</span>
                      </div>
                    )}
                    {audioHash && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <strong>Blockchain Hash:</strong> {audioHash.substring(0, 16)}...
                      </div>
                    )}
                  </div>
                  {audioUrl && (
                    <audio controls className="mx-auto">
                      <source src={audioUrl} type={audioFile.type} />
                    </audio>
                  )}
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <FileAudio className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">Upload Your Audio File</h4>
                    <p className="text-sm text-muted-foreground">
                      MP3, WAV, FLAC, M4A up to 100MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
          </div>

          <Alert>
            <Hash className="w-4 h-4" />
            <AlertDescription>
              Your audio file will be cryptographically hashed for secure blockchain storage. 
              The original file remains private and is only used for verification purposes.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("info")}>
              Back
            </Button>
            <Button 
              onClick={() => setStep("proof")}
              disabled={!audioFile || !trackInfo.trackTitle || !trackInfo.artistName || isHashing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Next: Upload Ownership Proof
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "proof") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Provide Ownership Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Required:</strong> Upload at least one document proving you own the rights to this music. 
              Multiple documents increase verification confidence.
            </AlertDescription>
          </Alert>

          {/* Proof Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Upload ownership documentation:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => proofInputRef.current?.click()}
              >
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 mt-1" />
                  <div className="text-left">
                    <div className="font-medium">Copyright Certificate</div>
                    <div className="text-xs text-muted-foreground">Official registration document</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => proofInputRef.current?.click()}
              >
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 mt-1" />
                  <div className="text-left">
                    <div className="font-medium">Distributor Agreement</div>
                    <div className="text-xs text-muted-foreground">DistroKid, CD Baby, etc.</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => proofInputRef.current?.click()}
              >
                <div className="flex items-start gap-3">
                  <FileAudio className="w-5 h-5 mt-1" />
                  <div className="text-left">
                    <div className="font-medium">Publishing Contract</div>
                    <div className="text-xs text-muted-foreground">Label or publishing deal</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => proofInputRef.current?.click()}
              >
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 mt-1" />
                  <div className="text-left">
                    <div className="font-medium">Creation Evidence</div>
                    <div className="text-xs text-muted-foreground">Studio photos, timestamps</div>
                  </div>
                </div>
              </Button>
            </div>

            <input
              ref={proofInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              multiple
              onChange={(e) => handleProofUpload(e, 'copyright_certificate')}
              className="hidden"
            />
          </div>

          {/* Uploaded Proofs */}
          {ownershipProofs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Uploaded documents:</h4>
              {ownershipProofs.map((proof, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">{proof.file.name}</div>
                      <div className="text-xs text-muted-foreground">{proof.description}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProof(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Self Declaration */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="declaration"
                checked={selfDeclaration}
                onCheckedChange={(checked) => setSelfDeclaration(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="declaration"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I declare that I own all rights to this music
                </Label>
                <p className="text-xs text-muted-foreground">
                  I confirm that I am the original creator or lawful owner of this musical work and have the legal right to tokenize it as an NFT. 
                  I understand that providing false information may result in legal consequences.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={ownershipProofs.length === 0 || !selfDeclaration}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Submit for Manual Review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}