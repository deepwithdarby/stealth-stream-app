import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock, Eye, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Client-Side Privacy",
      description: "All processing happens in your browser. Your secrets never leave your device."
    },
    {
      icon: Lock,
      title: "Strong Encryption",
      description: "AES-256 encryption with password protection for maximum security."
    },
    {
      icon: Eye,
      title: "Invisible Embedding",
      description: "Hide messages in text, images, audio, and video without visible changes."
    },
    {
      icon: Zap,
      title: "Universal Format",
      description: "Support for all major file formats with robust encoding techniques."
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate('/app');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen">
      <Header onAuthModalOpen={() => setIsAuthModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <Shield className="h-20 w-20 mx-auto text-primary glow-primary" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Stealth Stream
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Universal steganography tools for hiding secret messages in text, images, audio, and video with military-grade encryption.
            </p>
          </div>
          
          <Button 
            onClick={handleGetStarted}
            variant="hero"
            size="lg"
            className="text-xl px-12 py-6 h-auto"
          >
            {user ? 'Open App' : 'Get Started'}
          </Button>

          <div className="text-sm text-muted-foreground">
            🔒 Client-side processing • 🚀 No registration required • ⚡ Instant results
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Stealth Stream?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for privacy enthusiasts, security researchers, and anyone who values digital freedom.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="glass rounded-lg p-6 text-center space-y-4 transition-smooth hover:scale-105">
              <feature.icon className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="glass rounded-2xl p-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Hiding Secrets?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who trust Stealth Stream for their steganography needs.
          </p>
          <Button 
            onClick={handleGetStarted}
            variant="cyber"
            size="lg"
            className="text-lg px-8 py-4 h-auto"
          >
            {user ? 'Launch Application' : 'Sign In with Google'}
          </Button>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
