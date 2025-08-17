import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { VideoSteganography } from '@/lib/steganography';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Copy, Video, Lock, Unlock, AlertTriangle } from 'lucide-react';

export const VideoSteganographyComponent: React.FC = () => {
  // Encode states
  const [encodeVideoFile, setEncodeVideoFile] = useState<File | null>(null);
  const [encodeMessage, setEncodeMessage] = useState('');
  const [encodePassword, setEncodePassword] = useState('');
  const [useEncodePassword, setUseEncodePassword] = useState(false);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodedVideo, setEncodedVideo] = useState<Blob | null>(null);
  const [capacity, setCapacity] = useState<number>(0);

  // Decode states
  const [decodeVideoFile, setDecodeVideoFile] = useState<File | null>(null);
  const [decodePassword, setDecodePassword] = useState('');
  const [useDecodePassword, setUseDecodePassword] = useState(false);
  const [decodeProgress, setDecodeProgress] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedMessage, setDecodedMessage] = useState('');

  const encodeFileRef = useRef<HTMLInputElement>(null);
  const decodeFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (encodeVideoFile) {
      VideoSteganography.calculateCapacity(encodeVideoFile).then(setCapacity);
    }
  }, [encodeVideoFile]);

  const handleEncodeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is video
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (limit to 100MB for performance)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a video file smaller than 100MB for better performance",
          variant: "destructive"
        });
        return;
      }
      
      setEncodeVideoFile(file);
    }
  };

  const handleDecodeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDecodeVideoFile(file);
    }
  };

  const handleEncode = async () => {
    if (!encodeVideoFile || !encodeMessage.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please select a video file and enter a message",
        variant: "destructive"
      });
      return;
    }

    if (encodeMessage.length > capacity) {
      toast({
        title: "Message too large",
        description: `Message is ${encodeMessage.length} bytes, but capacity is only ${capacity} bytes`,
        variant: "destructive"
      });
      return;
    }

    setIsEncoding(true);
    setEncodeProgress(0);

    try {
      const password = useEncodePassword ? encodePassword : undefined;
      const encodedBlob = await VideoSteganography.encode(
        encodeVideoFile, 
        encodeMessage, 
        password,
        setEncodeProgress
      );
      
      setEncodedVideo(encodedBlob);

      toast({
        title: "Video encoded successfully",
        description: "Your secret message has been hidden in the video file"
      });
    } catch (error) {
      toast({
        title: "Encoding failed",
        description: error instanceof Error ? error.message : "An error occurred during encoding",
        variant: "destructive"
      });
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeVideoFile) {
      toast({
        title: "No file selected",
        description: "Please select a video file to decode",
        variant: "destructive"
      });
      return;
    }

    setIsDecoding(true);
    setDecodeProgress(0);

    try {
      const password = useDecodePassword ? decodePassword : undefined;
      const message = await VideoSteganography.decode(
        decodeVideoFile, 
        password,
        setDecodeProgress
      );
      
      if (message) {
        setDecodedMessage(message);
        toast({
          title: "Message decoded successfully",
          description: "Secret message has been extracted from the video"
        });
      } else {
        toast({
          title: "No message found",
          description: "No hidden message was found or wrong password was provided",
          variant: "destructive"
        });
        setDecodedMessage('');
      }
    } catch (error) {
      toast({
        title: "Decoding failed",
        description: error instanceof Error ? error.message : "An error occurred during decoding",
        variant: "destructive"
      });
    } finally {
      setIsDecoding(false);
    }
  };

  const downloadEncodedVideo = () => {
    if (encodedVideo) {
      const url = URL.createObjectURL(encodedVideo);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'encoded_video.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const copyDecodedMessage = () => {
    navigator.clipboard.writeText(decodedMessage);
    toast({
      title: "Copied to clipboard",
      description: "Decoded message has been copied"
    });
  };

  return (
    <div className="space-y-8">
      {/* Performance Warning */}
      <Card className="glass border-yellow-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-yellow-400">Performance Notice</h4>
              <p className="text-muted-foreground">
                Video steganography is computationally intensive. For optimal performance:
              </p>
              <ul className="text-muted-foreground space-y-1 ml-4">
                <li>• Keep videos under 100MB and 30 seconds</li>
                <li>• Processing may take several minutes</li>
                <li>• Output is limited to 640x480 resolution at 10fps</li>
                <li>• Use lossless WebM format to preserve hidden data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encode Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Hide Message in Video
          </CardTitle>
          <CardDescription>
            Embed a secret message into video frames using LSB steganography
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="encode-video-file">Select Video File</Label>
              <Input
                id="encode-video-file"
                type="file"
                accept="video/*"
                onChange={handleEncodeFileSelect}
                ref={encodeFileRef}
                className="mt-1"
              />
              {encodeVideoFile && (
                <div className="mt-2 p-3 glass rounded">
                  <p className="text-sm font-medium">{encodeVideoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {(encodeVideoFile.size / (1024 * 1024)).toFixed(2)} MB | 
                    Estimated capacity: ~{capacity} bytes
                  </p>
                  <video controls className="mt-2 w-full max-h-64">
                    <source src={URL.createObjectURL(encodeVideoFile)} type={encodeVideoFile.type} />
                  </video>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="encode-message">Secret Message</Label>
              <Textarea
                id="encode-message"
                placeholder="Enter your secret message here..."
                value={encodeMessage}
                onChange={(e) => setEncodeMessage(e.target.value)}
                className="mt-1"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {encodeMessage.length} / {capacity} bytes
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-encode-password"
                  checked={useEncodePassword}
                  onChange={(e) => setUseEncodePassword(e.target.checked)}
                />
                <Label htmlFor="use-encode-password" className="flex items-center gap-2">
                  {useEncodePassword ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  Use Password Protection
                </Label>
              </div>
              {useEncodePassword && (
                <Input
                  type="password"
                  placeholder="Enter password for encryption"
                  value={encodePassword}
                  onChange={(e) => setEncodePassword(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {isEncoding && (
              <div className="space-y-2">
                <Label>Encoding Progress</Label>
                <Progress value={encodeProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  This may take several minutes depending on video size...
                </p>
              </div>
            )}

            <Button
              onClick={handleEncode}
              disabled={!encodeVideoFile || !encodeMessage.trim() || isEncoding}
              className="w-full"
              variant="cyber"
            >
              {isEncoding ? 'Encoding...' : 'Hide Message'}
            </Button>

            {encodedVideo && (
              <div className="space-y-3 p-4 glass rounded">
                <p className="text-sm font-medium text-green-400">✓ Message successfully hidden in video</p>
                <video controls className="w-full max-h-64">
                  <source src={URL.createObjectURL(encodedVideo)} type="video/webm" />
                </video>
                <Button onClick={downloadEncodedVideo} variant="secondary" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Encoded Video (WebM)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="opacity-30" />

      {/* Decode Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Extract Message from Video
          </CardTitle>
          <CardDescription>
            Extract a hidden message from a video file created with steganography
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="decode-video-file">Select Video File</Label>
              <Input
                id="decode-video-file"
                type="file"
                accept="video/*"
                onChange={handleDecodeFileSelect}
                ref={decodeFileRef}
                className="mt-1"
              />
              {decodeVideoFile && (
                <div className="mt-2 p-3 glass rounded">
                  <p className="text-sm font-medium">{decodeVideoFile.name}</p>
                  <video controls className="mt-2 w-full max-h-64">
                    <source src={URL.createObjectURL(decodeVideoFile)} type={decodeVideoFile.type} />
                  </video>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-decode-password"
                  checked={useDecodePassword}
                  onChange={(e) => setUseDecodePassword(e.target.checked)}
                />
                <Label htmlFor="use-decode-password" className="flex items-center gap-2">
                  {useDecodePassword ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  File is Password Protected
                </Label>
              </div>
              {useDecodePassword && (
                <Input
                  type="password"
                  placeholder="Enter password to decrypt"
                  value={decodePassword}
                  onChange={(e) => setDecodePassword(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {isDecoding && (
              <div className="space-y-2">
                <Label>Decoding Progress</Label>
                <Progress value={decodeProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Extracting frames and analyzing video data...
                </p>
              </div>
            )}

            <Button
              onClick={handleDecode}
              disabled={!decodeVideoFile || isDecoding}
              className="w-full"
              variant="cyber"
            >
              {isDecoding ? 'Extracting...' : 'Extract Message'}
            </Button>

            {decodedMessage && (
              <div className="space-y-3 p-4 glass rounded">
                <Label>Extracted Message</Label>
                <Textarea
                  value={decodedMessage}
                  readOnly
                  className="min-h-[100px] bg-muted/50"
                />
                <Button onClick={copyDecodedMessage} variant="secondary" className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Message
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="glass border-blue-500/20">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-blue-400">Video Steganography Information</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Embeds data in blue channel LSB of video frames with 3x redundancy</li>
              <li>• Exports as lossless WebM to preserve hidden data</li>
              <li>• Supports most video formats as input (MP4, AVI, MOV, etc.)</li>
              <li>• Password protection uses AES-256 encryption</li>
              <li>• Processing is CPU intensive and may take several minutes</li>
              <li>• Best for short videos (&lt;30 seconds) for optimal performance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};