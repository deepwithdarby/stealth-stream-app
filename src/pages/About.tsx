import React from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, Code, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Shield className="h-16 w-16 mx-auto text-primary glow-primary mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            About Stealth Stream
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The most advanced, privacy-focused steganography platform designed for security researchers, 
            privacy enthusiasts, and anyone who values digital freedom.
          </p>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="glass rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed text-center max-w-4xl mx-auto">
              In an age where digital privacy is under constant threat, Stealth Stream empowers individuals 
              with military-grade steganography tools. We believe that privacy is a fundamental right, and 
              everyone should have access to secure communication methods that protect their sensitive information 
              from prying eyes.
            </p>
          </div>
        </section>

        {/* Technology Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Technology & Security</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass rounded-lg p-6 text-center">
              <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">AES-256 Encryption</h3>
              <p className="text-muted-foreground">
                Military-grade encryption ensures your hidden messages remain secure even if discovered.
              </p>
            </div>
            
            <div className="glass rounded-lg p-6 text-center">
              <Eye className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Client-Side Processing</h3>
              <p className="text-muted-foreground">
                All operations happen in your browser. Your secrets never touch our servers.
              </p>
            </div>
            
            <div className="glass rounded-lg p-6 text-center">
              <Code className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Advanced Algorithms</h3>
              <p className="text-muted-foreground">
                LSB encoding, frequency domain embedding, and zero-width character techniques.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Universal Format Support</h3>
                  <p className="text-muted-foreground">
                    Hide messages in text, images, audio, and video files with robust encoding that survives compression.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Privacy by Design</h3>
                  <p className="text-muted-foreground">
                    Zero-knowledge architecture means we can't access your data even if we wanted to.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Users className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Open Source Commitment</h3>
                  <p className="text-muted-foreground">
                    Transparent algorithms and auditable code ensure trust through verification.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Use Cases</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Secure communication in restricted environments</li>
                <li>• Digital watermarking and copyright protection</li>
                <li>• Educational purposes and security research</li>
                <li>• Covert data transmission and storage</li>
                <li>• Privacy protection for sensitive documents</li>
                <li>• Journalism and whistleblowing protection</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <div className="glass rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-6">About the Team</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Stealth Stream is developed by Deep With Darby, a cybersecurity researcher and privacy advocate 
              with extensive experience in cryptography and steganography. Our mission is to democratize 
              access to secure communication tools while maintaining the highest standards of privacy and security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/contact')}
                variant="cyber"
              >
                Contact Us
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;