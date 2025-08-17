import React from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextSteganographyComponent } from '@/components/steganography/TextSteganography';
import { ImageSteganographyComponent } from '@/components/steganography/ImageSteganography';
import { FileText, Image, Music, Video } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading Stealth Stream...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Universal Steganography Suite
          </h1>
          <p className="text-muted-foreground">
            Hide and extract secret messages with military-grade privacy
          </p>
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass mb-8">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <TextSteganographyComponent />
          </TabsContent>

          <TabsContent value="image">
            <ImageSteganographyComponent />
          </TabsContent>

          <TabsContent value="audio">
            <div className="text-center py-16">
              <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Audio Steganography</h3>
              <p className="text-muted-foreground">Coming Soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Hide messages in audio files using advanced frequency domain techniques
              </p>
            </div>
          </TabsContent>

          <TabsContent value="video">
            <div className="text-center py-16">
              <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Video Steganography</h3>
              <p className="text-muted-foreground">Coming Soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Embed secrets in video frames with temporal redundancy protection
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Privacy Notice */}
        <div className="mt-16 text-center">
          <div className="glass rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <span>🔒</span> Privacy First
            </h3>
            <p className="text-sm text-muted-foreground">
              All steganography operations are performed locally in your browser. 
              Your secret messages are never transmitted to our servers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainApp;