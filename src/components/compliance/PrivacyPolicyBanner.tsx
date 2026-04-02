import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'mm_privacy_consent';
const CONSENT_VERSION = '1.0';

export function PrivacyPolicyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so it doesn't flash during page load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.version !== CONSENT_VERSION) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        version: CONSENT_VERSION,
        acceptedAt: new Date().toISOString(),
      })
    );
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-lg p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10 flex-shrink-0">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground mb-1">Privacy and Data Usage</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  MindMaker uses essential cookies for session management and stores your preferences locally.
                  Your data is processed securely with encryption at rest and in transit.
                  We do not sell your personal information. You can manage your privacy settings and export
                  or delete your data at any time from Settings.
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleAccept} className="text-xs h-8">
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAccept}
                    className="text-xs h-8 text-muted-foreground"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
              <button
                onClick={handleAccept}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
