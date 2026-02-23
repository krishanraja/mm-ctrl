import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { Rocket, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const source = searchParams.get('source') || 'direct';
  
  const [context, setContext] = useState<string>('');

  useEffect(() => {
    // Determine context based on source
    const contexts: Record<string, string> = {
      'mission-help': "You mentioned needing help with your current mission",
      'high-performer': "Your AI leadership scores show you're in the top 30%",
      'momentum-slowing': "Your momentum has slowed - let's get you back on track",
      'direct': "Ready to accelerate your AI leadership?"
    };

    setContext(contexts[source] || contexts['direct']);
  }, [source]);

  const calendlyUrl = `https://calendly.com/mindmaker/decision-sprint?name=${encodeURIComponent(user?.email || '')}&email=${encodeURIComponent(user?.email || '')}&a1=${source}`;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="h-8 w-8 text-[#00D9B6]" />
              <CardTitle className="text-2xl">Book a 1:1 Decision Sprint</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">{context}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">90-minute intensive session</p>
                  <p className="text-sm text-muted-foreground">Deep-dive into your specific AI leadership challenge</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Personalized action plan</p>
                  <p className="text-sm text-muted-foreground">Walk away with concrete next steps tailored to your context</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Follow-up support</p>
                  <p className="text-sm text-muted-foreground">2 weeks of async support to ensure momentum</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => window.open(calendlyUrl, '_blank')}
                className="w-full bg-[#00D9B6] hover:bg-[#00D9B6]/90 text-black font-medium h-12 text-lg"
              >
                Book Your Sprint
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Opens Calendly in new window
              </p>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
