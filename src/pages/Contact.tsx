import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageCircle, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Contact: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Create mailto link with form data
    const mailtoLink = `mailto:deepwithdarby@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\n\nMessage:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
    
    toast({
      title: "Email Client Opened",
      description: "Your default email client should open with the pre-filled message",
    });

    // Reset form
    setFormData({ name: '', subject: '', message: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <section className="text-center mb-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <Mail className="h-16 w-16 mx-auto text-primary glow-primary mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about steganography, need support, or want to collaborate? 
            We'd love to hear from you.
          </p>
        </section>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Send a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    className="min-h-32"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                  />
                </div>

                <Button type="submit" variant="cyber" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground">deepwithdarby@gmail.com</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-muted-foreground">Usually within 24-48 hours</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Is Stealth Stream really secure?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! All processing happens in your browser using client-side encryption. 
                    Your data never leaves your device.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Can I use this for commercial purposes?</h3>
                  <p className="text-muted-foreground text-sm">
                    Stealth Stream is free for personal and educational use. 
                    Contact us for commercial licensing options.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Do you offer custom development?</h3>
                  <p className="text-muted-foreground text-sm">
                    We provide custom steganography solutions for enterprises and researchers. 
                    Get in touch to discuss your requirements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Notice */}
        <section className="mt-16">
          <div className="glass rounded-lg p-6 max-w-3xl mx-auto text-center">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Security Notice
            </h3>
            <p className="text-sm text-muted-foreground">
              For security-related inquiries or vulnerability reports, please use our secure contact form above. 
              We take security seriously and will respond promptly to legitimate security concerns.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;