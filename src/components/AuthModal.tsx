import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const { user, error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive"
      });
    } else if (user) {
      toast({
        title: "Welcome to Stealth Stream!",
        description: `Successfully signed in as ${user.displayName || user.email}`,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-white/20 max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to Stealth Stream
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Sign in with Google to access universal steganography tools with client-side privacy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <Button 
            onClick={handleGoogleSignIn}
            variant="cyber"
            size="lg"
            className="w-full"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            Your data is processed client-side for maximum privacy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};