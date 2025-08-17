import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Shield, LogOut, Info, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onAuthModalOpen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthModalOpen }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of Stealth Stream",
      });
      navigate('/');
    }
  };

  const isMainApp = location.pathname === '/app';

  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer transition-smooth hover:scale-105"
          onClick={() => navigate('/')}
        >
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Stealth Stream
            </h1>
            <p className="text-xs text-muted-foreground">Universal Steganography</p>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          {!isMainApp && (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/about')}
                className="hidden sm:inline-flex"
              >
                <Info className="mr-2 h-4 w-4" />
                About
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/contact')}
                className="hidden sm:inline-flex"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </Button>
            </>
          )}
          
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.displayName || user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            !isMainApp && (
              <Button variant="cyber" onClick={onAuthModalOpen}>
                Get Started
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
};