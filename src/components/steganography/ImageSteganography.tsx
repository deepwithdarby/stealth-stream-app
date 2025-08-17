import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ImageSteganography } from '@/lib/steganography';
import { Copy, Download, Upload, Eye, EyeOff } from 'lucide-react';

export const ImageSteganographyComponent: React.FC = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decodeFileInputRef = useRef<HTMLInputElement>(null);

  // Encode state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [secretMessage, setSecretMessage] = useState('');
  const [encodePassword, setEncodePassword] = useState('');
  const [encodedCanvas, setEncodedCanvas] = useState<HTMLCanvasElement | null>(null);

  // Decode state
  const [decodeImage, setDecodeImage] = useState<File | null>(null);
  const [decodePreview, setDecodePreview] = useState<string>('');
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedResult, setDecodedResult] = useState('');

  const handleImageSelect = (file: File, isDecoding = false) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (isDecoding) {
        setDecodeImage(file);
        setDecodePreview(preview);
      } else {
        setSelectedImage(file);
        setImagePreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadImageToCanvas = (imageSrc: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  const handleEncode = async () => {
    if (!selectedImage || !secretMessage) {
      toast({
        title: "Missing Input",
        description: "Please select an image and enter a secret message",
        variant: "destructive"
      });
      return;
    }

    try {
      const canvas = await loadImageToCanvas(imagePreview);
      const encodedCanvas = ImageSteganography.encode(canvas, secretMessage, encodePassword || undefined);
      setEncodedCanvas(encodedCanvas);
      
      toast({
        title: "Encoding Successful",
        description: "Your secret message has been hidden in the image",
      });
    } catch (error: any) {
      toast({
        title: "Encoding Failed",
        description: error.message || "Failed to encode the message",
        variant: "destructive"
      });
    }
  };

  const handleDecode = async () => {
    if (!decodeImage) {
      toast({
        title: "Missing Input",
        description: "Please select an image to decode",
        variant: "destructive"
      });
      return;
    }

    try {
      const canvas = await loadImageToCanvas(decodePreview);
      const result = ImageSteganography.decode(canvas, decodePassword || undefined);
      
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

  const downloadEncodedImage = () => {
    if (!encodedCanvas) return;

    encodedCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'encoded-image.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Image Steganography
        </h2>
        <p className="text-muted-foreground mt-2">
          Hide secret messages in images using LSB encoding
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
              <CardTitle>Hide Message in Image</CardTitle>
              <CardDescription>
                Embed your secret message invisibly within an image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cover Image</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded" />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        Click to upload image or drag & drop
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
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

              {encodedCanvas && (
                <div className="space-y-2">
                  <Label>Encoded Image</Label>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <canvas
                      ref={(ref) => {
                        if (ref && encodedCanvas) {
                          ref.width = encodedCanvas.width;
                          ref.height = encodedCanvas.height;
                          const ctx = ref.getContext('2d')!;
                          ctx.drawImage(encodedCanvas, 0, 0);
                        }
                      }}
                      className="max-w-full h-auto rounded"
                    />
                    <div className="mt-2">
                      <Button onClick={downloadEncodedImage} variant="secondary">
                        <Download className="mr-2 h-4 w-4" />
                        Download Encoded Image
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
              <CardTitle>Extract Message from Image</CardTitle>
              <CardDescription>
                Decode hidden messages from steganographic images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Steganographic Image</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => decodeFileInputRef.current?.click()}
                >
                  {decodePreview ? (
                    <img src={decodePreview} alt="Preview" className="max-h-64 mx-auto rounded" />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        Click to upload image with hidden message
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={decodeFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file, true);
                  }}
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