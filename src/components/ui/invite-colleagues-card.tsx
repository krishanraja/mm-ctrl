import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, Check, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InviteColleaguesCardProps {
  companyName: string;
  assessmentId: string;
  userEmail: string;
  userName?: string;
}

export const InviteColleaguesCard = React.memo<InviteColleaguesCardProps>(({ 
  companyName,
  assessmentId,
  userEmail,
  userName
}) => {
  const [copied, setCopied] = useState(false);
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [referralStats, setReferralStats] = useState({ total: 0, converted: 0, pending: 0 });
  const { toast } = useToast();

  // PHASE 4: Generate referral code on mount
  useEffect(() => {
    const initReferral = async () => {
      const { generateReferralCode, getReferralStats } = await import('@/utils/generateReferralCode');
      
      const referralData = await generateReferralCode(assessmentId, userEmail, userName);
      if (referralData) {
        setReferralUrl(referralData.url);
      }
      
      const stats = await getReferralStats(assessmentId);
      setReferralStats(stats);
    };
    
    initReferral();
  }, [assessmentId, userEmail, userName]);
  
  const inviteMessage = `I just completed an AI Leadership Assessment with MindMaker. It gave me personalized insights on my AI readiness. Want to see how ${companyName} compares as a team?\n\nTake the assessment here: ${referralUrl || window.location.origin}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl || inviteMessage);
      setCopied(true);
      toast({
        title: 'Referral Link Copied!',
        description: 'Share this trackable link with your team',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('AI Leadership Assessment - Join Me');
    const body = encodeURIComponent(inviteMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Unlock Team Momentum Insights</CardTitle>
              <CardDescription className="mt-1">
                When 3+ colleagues complete the assessment, unlock company-wide adoption metrics
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-background rounded-lg border border-border/50">
          <h4 className="font-semibold text-sm mb-3">Share with Your Team</h4>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralUrl || 'Generating your unique link...'}
              className="flex-1 text-sm"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleEmailShare}
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">What You'll Unlock:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Team momentum score and adoption trajectory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Compare individual readiness across your organization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Identify skill gaps and alignment opportunities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Track engagement and repeat assessment patterns</span>
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground text-center">
          Progress: {referralStats.converted + 1}/3 colleagues completed
          {referralStats.converted < 2 && ` • Invite ${3 - referralStats.converted - 1} more to unlock`}
          {referralStats.converted >= 2 && ' • Team insights unlocked! 🎉'}
        </div>
      </CardContent>
    </Card>
  );
});

InviteColleaguesCard.displayName = 'InviteColleaguesCard';
