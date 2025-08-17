import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { TextSteganography } from '@/lib/steganography';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';

export const TextSteganographyComponent: React.FC = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Encode state
  const [coverText, setCoverText] = useState('');
  const [secretMessage, setSecretMessage] = useState('');
  const [encodePassword, setEncodePassword] = useState('');
  const [encodedResult, setEncodedResult] = useState('');

  // Decode state
  const [stegoText, setStegoText] = useState('');
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedResult, setDecodedResult] = useState('');

  const handleEncode = () => {
    if (!coverText || !secretMessage) {
      toast({
        title: "Missing Input",
        description: "Please provide both cover text and secret message",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = TextSteganography.encode(coverText, secretMessage, encodePassword || undefined);
      setEncodedResult(result);
      toast({
        title: "Encoding Successful",
        description: "Your secret message has been hidden in the text",
      });
    } catch (error) {
      toast({
        title: "Encoding Failed",
        description: "Failed to encode the message",
        variant: "destructive"
      });
    }
  };

  const handleDecode = () => {
    if (!stegoText) {
      toast({
        title: "Missing Input",
        description: "Please provide text to decode",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = TextSteganography.decode(stegoText, decodePassword || undefined);
      if (result) {
        setDecodedResult(result);
        toast({
          title: "Decoding Successful",
          description: "Secret message extracted successfully",
        });
      } else {
        toast({
          title: "Decoding Failed",
          description: "No hidden message found or wrong password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Decoding Failed",
        description: "Failed to decode the message",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Text Steganography
        </h2>
        <p className="text-muted-foreground mt-2">
          Hide secret messages in plain text using invisible characters
        </p>
      </div>

      <Tabs defaultValue="encode" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass">
          <TabsTrigger value="encode">Encode</TabsTrigger>
          <TabsTrigger value="decode">Decode</TabsTrigger>
        </TabsList>

        <TabsContent value="encode" className="space-y-4">
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle>Hide Secret Message</CardTitle>
              <CardDescription>
                Embed your secret message invisibly within cover text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cover-text">Cover Text (public text)</Label>
                <Textarea
                  id="cover-text"
                  placeholder="Enter the text that will be visible to everyone..."
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div>
                <Label htmlFor="secret-message">Secret Message</Label>
                <Textarea
                  id="secret-message"
                  placeholder="Enter your secret message to hide..."
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="encode-password">Password (optional)</Label>
                <div className="relative">
                  <Input
                    id="encode-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Optional password for encryption"
                    value={encodePassword}
                    onChange={(e) => setEncodePassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleEncode} variant="cyber" className="w-full">
                Encode Message
              </Button>

              {encodedResult && (
                <div className="space-y-2">
                  <Label>Encoded Result</Label>
                  <div className="relative">
                    <Textarea
                      value={encodedResult}
                      readOnly
                      className="min-h-32 pr-20"
                    />
                    <div className="absolute top-2 right-2 space-y-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(encodedResult)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => downloadText(encodedResult, 'encoded-message.txt')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decode" className="space-y-4">
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle>Extract Secret Message</CardTitle>
              <CardDescription>
                Decode hidden messages from steganographic text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stego-text">Steganographic Text</Label>
                <Textarea
                  id="stego-text"
                  placeholder="Paste the text containing hidden message..."
                  value={stegoText}
                  onChange={(e) => setStegoText(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div>
                <Label htmlFor="decode-password">Password (if encrypted)</Label>
                <div className="relative">
                  <Input
                    id="decode-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password if message was encrypted"
                    value={decodePassword}
                    onChange={(e) => setDecodePassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleDecode} variant="secondary" className="w-full">
                Decode Message
              </Button>

              {decodedResult && (
                <div className="space-y-2">
                  <Label>Extracted Message</Label>
                  <div className="relative">
                    <Textarea
                      value={decodedResult}
                      readOnly
                      className="min-h-24 pr-12 bg-accent/20"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(decodedResult)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};