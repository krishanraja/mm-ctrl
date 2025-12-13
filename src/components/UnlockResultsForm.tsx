import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { validateEmail, validateRequired } from '@/utils/formValidation';
import { DEPARTMENTS } from '@/constants/departments';

export interface UnlockFormData {
  fullName: string;
  email: string;
  department: string;
  password: string;
  consentToInsights: boolean;
}

interface UnlockResultsFormProps {
  onSubmit: (data: UnlockFormData) => void;
  isLoading?: boolean;
}

export const UnlockResultsForm: React.FC<UnlockResultsFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UnlockFormData>({
    fullName: '',
    email: '',
    department: '',
    password: '',
    consentToInsights: false
  });
  const [errors, setErrors] = useState<Partial<UnlockFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<UnlockFormData> = {};
    
    const fullNameError = validateRequired(formData.fullName, 'Full name');
    if (fullNameError) newErrors.fullName = fullNameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const departmentError = validateRequired(formData.department, 'Department');
    if (departmentError) newErrors.department = departmentError;

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.consentToInsights) {
      newErrors.consentToInsights = 'Please accept to continue' as any;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof UnlockFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="shadow-lg border rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="pb-2 pt-6 px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Unlock Your Full Results</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Create your account to access personalized prompts, peer comparison, and strategic insights.
        </p>
      </CardHeader>
      <CardContent className="p-6 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="unlockFullName" className="text-foreground font-medium text-sm flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Full Name
            </Label>
            <Input
              id="unlockFullName"
              type="text"
              value={formData.fullName}
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
            <Label htmlFor="unlockEmail" className="text-foreground font-medium text-sm flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Work Email
            </Label>
            <Input
              id="unlockEmail"
              type="email"
              value={formData.email}
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
            <Label htmlFor="unlockDepartment" className="text-foreground font-medium text-sm">
              Department
            </Label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleInputChange('department', value)}
            >
              <SelectTrigger id="unlockDepartment" className="rounded-lg bg-background">
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

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="unlockPassword" className="text-foreground font-medium text-sm flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              Create Password
            </Label>
            <Input
              id="unlockPassword"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="rounded-lg"
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password}</p>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="space-y-2 pt-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="unlockConsent"
                checked={formData.consentToInsights}
                onChange={(e) => handleInputChange('consentToInsights', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input"
              />
              <Label htmlFor="unlockConsent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                I consent to receiving personalized AI leadership insights and recommendations.
              </Label>
            </div>
            {errors.consentToInsights && (
              <p className="text-destructive text-xs">{errors.consentToInsights}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="cta"
            className="w-full rounded-lg py-5 mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Unlock Full Results'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
