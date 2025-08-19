import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AudioSteganography } from '@/lib/steganography';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Copy, Volume2, Lock, Unlock } from 'lucide-react';

export const AudioSteganographyComponent: React.FC = () => {
  // Encode states
  const [encodeAudioFile, setEncodeAudioFile] = useState<File | null>(null);
  const [encodeMessage, setEncodeMessage] = useState('');
  const [encodePassword, setEncodePassword] = useState('');
  const [useEncodePassword, setUseEncodePassword] = useState(false);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodedAudio, setEncodedAudio] = useState<Blob | null>(null);
  const [capacity, setCapacity] = useState<number>(0);

  // Decode states
  const [decodeAudioFile, setDecodeAudioFile] = useState<File | null>(null);
  const [decodePassword, setDecodePassword] = useState('');
  const [useDecodePassword, setUseDecodePassword] = useState(false);
  const [decodeProgress, setDecodeProgress] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedMessage, setDecodedMessage] = useState('');

  const encodeFileRef = useRef<HTMLInputElement>(null);
  const decodeFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (encodeAudioFile) {
      AudioSteganography.calculateCapacity(encodeAudioFile).then(setCapacity);
    }
  }, [encodeAudioFile]);

  const handleEncodeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is audio
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive"
        });
        return;
      }
      setEncodeAudioFile(file);
    }
  };

  const handleDecodeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDecodeAudioFile(file);
    }
  };

  const handleEncode = async () => {
    if (!encodeAudioFile || !encodeMessage.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please select an audio file and enter a message",
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
      // Simulate progress
      const progressInterval = setInterval(() => {
        setEncodeProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const password = useEncodePassword ? encodePassword : undefined;
      const encodedBlob = await AudioSteganography.encode(encodeAudioFile, encodeMessage, password);
      
      clearInterval(progressInterval);
      setEncodeProgress(100);
      setEncodedAudio(encodedBlob);

      toast({
        title: "Audio encoded successfully",
        description: "Your secret message has been hidden in the audio file"
      });
    } catch (error) {
      toast({
        title: "Encoding failed",
        description: (error as Error)?.message || "An error occurred during encoding",
        variant: "destructive"
      });
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeAudioFile) {
      toast({
        title: "No file selected",
        description: "Please select an audio file to decode",
        variant: "destructive"
      });
      return;
    }

    setIsDecoding(true);
    setDecodeProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDecodeProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const password = useDecodePassword ? decodePassword : undefined;
      const message = await AudioSteganography.decode(decodeAudioFile, password);
      
      clearInterval(progressInterval);
      setDecodeProgress(100);

      if (message) {
        setDecodedMessage(message);
        toast({
          title: "Message decoded successfully",
          description: "Secret message has been extracted from the audio"
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
        description: (error as Error)?.message || "An error occurred during decoding",
        variant: "destructive"
      });
    } finally {
      setIsDecoding(false);
    }
  };

  const downloadEncodedAudio = () => {
    if (encodedAudio) {
      const url = URL.createObjectURL(encodedAudio);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'encoded_audio.wav';
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
      {/* Encode Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Hide Message in Audio
          </CardTitle>
          <CardDescription>
            Embed a secret message into an audio file using LSB steganography on PCM data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="encode-audio-file">Select Audio File</Label>
              <Input
                id="encode-audio-file"
                type="file"
                accept="audio/*"
                onChange={handleEncodeFileSelect}
                ref={encodeFileRef}
                className="mt-1"
              />
              {encodeAudioFile && (
                <div className="mt-2 p-3 glass rounded">
                  <p className="text-sm font-medium">{encodeAudioFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Capacity: ~{capacity} bytes
                  </p>
                  <audio controls className="mt-2 w-full">
                    <source src={URL.createObjectURL(encodeAudioFile)} type={encodeAudioFile.type} />
                  </audio>
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
              </div>
            )}

            <Button
              onClick={handleEncode}
              disabled={!encodeAudioFile || !encodeMessage.trim() || isEncoding}
              className="w-full"
              variant="cyber"
            >
              {isEncoding ? 'Encoding...' : 'Hide Message'}
            </Button>

            {encodedAudio && (
              <div className="space-y-3 p-4 glass rounded">
                <p className="text-sm font-medium text-green-400">✓ Message successfully hidden in audio</p>
                <audio controls className="w-full">
                  <source src={URL.createObjectURL(encodedAudio)} type="audio/wav" />
                </audio>
                <Button onClick={downloadEncodedAudio} variant="secondary" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Encoded Audio (WAV)
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
            Extract Message from Audio
          </CardTitle>
          <CardDescription>
            Extract a hidden message from an audio file created with steganography
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="decode-audio-file">Select Audio File</Label>
              <Input
                id="decode-audio-file"
                type="file"
                accept="audio/*"
                onChange={handleDecodeFileSelect}
                ref={decodeFileRef}
                className="mt-1"
              />
              {decodeAudioFile && (
                <div className="mt-2 p-3 glass rounded">
                  <p className="text-sm font-medium">{decodeAudioFile.name}</p>
                  <audio controls className="mt-2 w-full">
                    <source src={URL.createObjectURL(decodeAudioFile)} type={decodeAudioFile.type} />
                  </audio>
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
              </div>
            )}

            <Button
              onClick={handleDecode}
              disabled={!decodeAudioFile || isDecoding}
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
            <h4 className="font-semibold text-blue-400">Audio Steganography Information</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Uses LSB embedding on PCM audio data with 3x redundancy</li>
              <li>• Exports as lossless WAV format to preserve hidden data</li>
              <li>• Supports most audio formats as input (MP3, WAV, M4A, etc.)</li>
              <li>• Password protection uses AES-256 encryption</li>
              <li>• May take longer for large files due to transcoding</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};