import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, ArrowRight, Target } from 'lucide-react';
import { validateEmail, validateRequired } from '@/utils/formValidation';
import { DEPARTMENTS } from '@/constants/departments';

export interface ContactData {
  fullName: string;
  email: string;
  department: string;
  primaryFocus: string;
  // Legacy fields maintained for compatibility
  companyName?: string;
  companySize?: string;
  timeline?: string;
  consentToInsights?: boolean;
  role?: string;
}

interface ContactCollectionFormProps {
  onSubmit: (contactData: ContactData) => void;
  onBack?: () => void;
}

const PRIMARY_FOCUS_OPTIONS = [
  { value: 'Strategy & Vision', label: 'Building AI strategy & vision' },
  { value: 'Team Enablement', label: 'Enabling my team with AI tools' },
  { value: 'Process Automation', label: 'Automating business processes' },
  { value: 'Product Innovation', label: 'AI-driven product innovation' },
  { value: 'Competitive Advantage', label: 'Creating competitive advantage' },
  { value: 'Cost Optimization', label: 'Cost optimization & efficiency' },
] as const;

export const ContactCollectionForm = React.memo<ContactCollectionFormProps>(({ onSubmit, onBack }) => {
  const [contactData, setContactData] = useState<ContactData>({
    fullName: '',
    email: '',
    department: '',
    primaryFocus: '',
    consentToInsights: true, // Default to true since we removed the checkbox
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactData, string>>>({});

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ContactData, string>> = {};
    
    const fullNameError = validateRequired(contactData.fullName, 'Full name');
    if (fullNameError) newErrors.fullName = fullNameError;
    
    const emailError = validateEmail(contactData.email);
    if (emailError) newErrors.email = emailError;

    const departmentError = validateRequired(contactData.department, 'Department');
    if (departmentError) newErrors.department = departmentError;

    const primaryFocusError = validateRequired(contactData.primaryFocus, 'Primary AI focus');
    if (primaryFocusError) newErrors.primaryFocus = primaryFocusError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(contactData);
    }
  };

  const handleInputChange = (field: keyof ContactData, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-background min-h-[100dvh] flex items-center justify-center px-4 py-6">
      <Card className="w-full max-w-md shadow-sm border rounded-xl">
        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
              Almost there!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We'll personalize your results based on your role
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-foreground font-medium text-sm flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={contactData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="rounded-lg"
                placeholder="Your name"
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-destructive text-xs">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground font-medium text-sm flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Work Email
              </Label>
              <Input
                id="email"
                type="email"
                value={contactData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="rounded-lg"
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email}</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-foreground font-medium text-sm">
                Department
              </Label>
              <Select
                value={contactData.department}
                onValueChange={(value) => handleInputChange('department', value)}
              >
                <SelectTrigger id="department" className="rounded-lg bg-background">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-destructive text-xs">{errors.department}</p>
              )}
            </div>

            {/* Primary AI Focus */}
            <div className="space-y-1.5">
              <Label htmlFor="primaryFocus" className="text-foreground font-medium text-sm flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                Primary AI Focus
              </Label>
              <Select
                value={contactData.primaryFocus}
                onValueChange={(value) => handleInputChange('primaryFocus', value)}
              >
                <SelectTrigger id="primaryFocus" className="rounded-lg bg-background">
                  <SelectValue placeholder="What's your main AI goal?" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {PRIMARY_FOCUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.primaryFocus && (
                <p className="text-destructive text-xs">{errors.primaryFocus}</p>
              )}
            </div>

            {/* Privacy Note */}
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed">
              Your data is used solely to personalize your results. We never share or sell your information.
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="cta"
              className="w-full rounded-xl py-5"
            >
              See My Results
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {/* Back Link */}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                ← Back to questions
              </button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
});

ContactCollectionForm.displayName = 'ContactCollectionForm';
