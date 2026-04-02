/**
 * Compliance Frameworks - Static Control Definitions
 *
 * Maps SOC2, HIPAA, GDPR, CCPA, and ISO 27001 controls
 * to their technical implementations in the MindMaker platform.
 */

export type ControlStatus = 'implemented' | 'partial' | 'planned';

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: ControlStatus;
  implementation: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  fullName: string;
  description: string;
  controls: ComplianceControl[];
}

export const complianceFrameworks: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2',
    fullName: 'SOC 2 Type II',
    description: 'Service Organization Control - Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.',
    controls: [
      {
        id: 'soc2-cc6.1',
        name: 'Logical Access Controls',
        description: 'Restrict access to information assets through authentication and authorization',
        status: 'implemented',
        implementation: 'Supabase JWT authentication with Row-Level Security (RLS) on all 37+ sensitive tables. Users can only access their own data.',
      },
      {
        id: 'soc2-cc7.2',
        name: 'System Monitoring',
        description: 'Monitor system components for anomalies and security events',
        status: 'implemented',
        implementation: 'Comprehensive audit logging via data_audit_log and ai_usage_audit tables. All data operations and AI calls tracked with timestamps.',
      },
      {
        id: 'soc2-cc6.3',
        name: 'Encryption',
        description: 'Protect data in transit and at rest using encryption',
        status: 'implemented',
        implementation: 'HTTPS for all data in transit. AES-256-GCM encryption for sensitive memory data at rest. Supabase-managed database encryption.',
      },
      {
        id: 'soc2-cc6.8',
        name: 'Session Management',
        description: 'Manage user sessions with proper timeout and refresh',
        status: 'implemented',
        implementation: 'JWT-based sessions with automatic token refresh. Auth state machine manages loading, authenticated, expired, and signed-out states.',
      },
      {
        id: 'soc2-cc8.1',
        name: 'Change Management',
        description: 'Control and document changes to system components',
        status: 'implemented',
        implementation: 'Git-based version control with 120+ tracked database migrations. All schema changes are versioned and auditable.',
      },
      {
        id: 'soc2-cc5.2',
        name: 'Risk Assessment',
        description: 'Identify and assess risks to achieving objectives',
        status: 'partial',
        implementation: 'Security audit logging captures access patterns. Rate limiting on AI endpoints. Compliance dashboard provides control visibility.',
      },
    ],
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act',
    description: 'Protects sensitive patient health information (PHI) from disclosure without consent or knowledge.',
    controls: [
      {
        id: 'hipaa-164.312a',
        name: 'Access Control',
        description: 'Implement technical policies to allow access only to authorized persons',
        status: 'implemented',
        implementation: 'Row-Level Security enforces per-user data isolation. Service role access restricted to server-side edge functions only.',
      },
      {
        id: 'hipaa-164.312b',
        name: 'Audit Controls',
        description: 'Implement mechanisms to record and examine activity in systems containing PHI',
        status: 'implemented',
        implementation: 'data_audit_log tracks all CRUD operations with old/new values. ai_usage_audit tracks all AI processing. security_audit_log captures auth events.',
      },
      {
        id: 'hipaa-164.312c',
        name: 'Integrity Controls',
        description: 'Protect electronic PHI from improper alteration or destruction',
        status: 'implemented',
        implementation: 'Memory verification system with confidence scoring (0-1). Facts track verification_status: inferred, verified, corrected, rejected.',
      },
      {
        id: 'hipaa-164.312e',
        name: 'Transmission Security',
        description: 'Implement security measures to guard against unauthorized access during transmission',
        status: 'implemented',
        implementation: 'All API communication over HTTPS/TLS. Edge functions enforce security headers. OpenAI calls use encrypted HTTPS connections.',
      },
      {
        id: 'hipaa-164.314',
        name: 'Business Associate Agreements',
        description: 'Ensure third-party service providers protect PHI',
        status: 'partial',
        implementation: 'Subprocessors identified: Supabase (database), OpenAI (AI processing), Stripe (payments), Resend (email). BAA tracking in compliance dashboard.',
      },
      {
        id: 'hipaa-164.312d',
        name: 'Minimum Necessary',
        description: 'Limit PHI access to the minimum necessary for the intended purpose',
        status: 'implemented',
        implementation: 'Memory context builder filters data by use case. Different AI prompts receive only relevant fact categories (identity, business, objective, etc.).',
      },
    ],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    fullName: 'General Data Protection Regulation',
    description: 'EU regulation on data protection and privacy for all individuals within the European Union and European Economic Area.',
    controls: [
      {
        id: 'gdpr-art6',
        name: 'Lawful Basis for Processing',
        description: 'Ensure valid legal basis exists for all data processing activities',
        status: 'implemented',
        implementation: 'Consent management with granular toggles for index publication, case studies, and service updates. Consent changes logged to consent_audit.',
      },
      {
        id: 'gdpr-art7',
        name: 'Conditions for Consent',
        description: 'Demonstrate that data subjects have given valid consent',
        status: 'implemented',
        implementation: 'Consent flags stored with timestamps. consent_audit table tracks changes with IP address and user agent for proof of consent.',
      },
      {
        id: 'gdpr-art15',
        name: 'Right of Access',
        description: 'Allow data subjects to obtain confirmation and access to their personal data',
        status: 'implemented',
        implementation: 'Data export available in Settings > Privacy. Users can download all profile, memory, assessment, and conversation data as JSON.',
      },
      {
        id: 'gdpr-art17',
        name: 'Right to Erasure',
        description: 'Allow data subjects to request deletion of personal data',
        status: 'implemented',
        implementation: 'Server-side account deletion via delete-account edge function. Cascading deletion of all user data with full audit trail.',
      },
      {
        id: 'gdpr-art20',
        name: 'Right to Data Portability',
        description: 'Allow data subjects to receive their data in a structured, machine-readable format',
        status: 'implemented',
        implementation: 'JSON data export includes profile, memories, assessments, conversations. Memory export supports JSON and markdown formats.',
      },
      {
        id: 'gdpr-art5e',
        name: 'Storage Limitation',
        description: 'Keep personal data only as long as necessary for the processing purpose',
        status: 'implemented',
        implementation: 'Configurable retention policies (30 days, 90 days, or indefinite). Automated cleanup via cleanup-expired-data edge function.',
      },
      {
        id: 'gdpr-art32',
        name: 'Security of Processing',
        description: 'Implement appropriate technical measures to ensure data security',
        status: 'implemented',
        implementation: 'RLS, AES-256-GCM encryption, JWT authentication, security headers on all endpoints, rate limiting on AI functions.',
      },
    ],
  },
  {
    id: 'ccpa',
    name: 'CCPA',
    fullName: 'California Consumer Privacy Act',
    description: 'California state statute to enhance privacy rights and consumer protection for residents of California.',
    controls: [
      {
        id: 'ccpa-1798.100',
        name: 'Right to Know',
        description: 'Consumers can request disclosure of personal information collected',
        status: 'implemented',
        implementation: 'Privacy Data tab displays all collected facts with categories. Data export provides complete JSON dump of all personal information.',
      },
      {
        id: 'ccpa-1798.105',
        name: 'Right to Delete',
        description: 'Consumers can request deletion of personal information',
        status: 'implemented',
        implementation: 'Individual fact deletion in Memory Browser. Full account deletion via server-side edge function with cascading data removal.',
      },
      {
        id: 'ccpa-1798.110',
        name: 'Right to Disclosure',
        description: 'Businesses must disclose categories and purposes of data collection',
        status: 'implemented',
        implementation: 'Memory facts organized by category (identity, business, objective, blocker, preference). Privacy controls show what data is stored and why.',
      },
      {
        id: 'ccpa-1798.120',
        name: 'Right to Opt-Out of Sale',
        description: 'Consumers can opt out of the sale of their personal information',
        status: 'implemented',
        implementation: 'Consent toggles for data sharing (index publication, case studies, outreach). Users can disable all data sharing individually.',
      },
      {
        id: 'ccpa-1798.125',
        name: 'Non-Discrimination',
        description: 'Businesses cannot discriminate against consumers exercising CCPA rights',
        status: 'implemented',
        implementation: 'All core features available regardless of privacy settings. Memory storage can be disabled without losing access to assessments or AI features.',
      },
    ],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    fullName: 'ISO/IEC 27001:2022',
    description: 'International standard for information security management systems (ISMS).',
    controls: [
      {
        id: 'iso-a5',
        name: 'Information Security Policies',
        description: 'Provide management direction and support for information security',
        status: 'implemented',
        implementation: 'Privacy settings, consent management, and retention policies configurable per user. Compliance dashboard provides policy visibility.',
      },
      {
        id: 'iso-a6',
        name: 'Access Control',
        description: 'Limit access to information and information processing facilities',
        status: 'implemented',
        implementation: 'JWT authentication, RLS policies on all tables, service role restricted to edge functions. Anonymous sessions supported for limited access.',
      },
      {
        id: 'iso-a8',
        name: 'Asset Management',
        description: 'Identify information assets and define appropriate protection responsibilities',
        status: 'implemented',
        implementation: 'Data classification badges label sensitivity levels (Public, Internal, Confidential, Restricted). Memory facts categorized by type.',
      },
      {
        id: 'iso-a10',
        name: 'Cryptography',
        description: 'Ensure proper use of cryptography to protect information',
        status: 'implemented',
        implementation: 'AES-256-GCM for memory encryption. HTTPS/TLS for all communications. Supabase handles database-level encryption at rest.',
      },
      {
        id: 'iso-a12',
        name: 'Operations Security',
        description: 'Ensure correct and secure operations of information processing facilities',
        status: 'implemented',
        implementation: 'Rate limiting on AI endpoints. AI response caching with TTL. Automated data retention cleanup. Non-blocking audit logging.',
      },
      {
        id: 'iso-a16',
        name: 'Information Security Incident Management',
        description: 'Ensure consistent approach to managing security incidents',
        status: 'partial',
        implementation: 'Security audit log captures auth events and data deletions. Compliance events table tracks policy changes. Incident response workflow planned.',
      },
      {
        id: 'iso-a18',
        name: 'Compliance',
        description: 'Avoid breaches of legal, statutory, regulatory, or contractual obligations',
        status: 'implemented',
        implementation: 'Multi-framework compliance dashboard. GDPR/CCPA data subject rights implemented. Audit trails for all data operations.',
      },
    ],
  },
];

/**
 * Get summary stats for a framework
 */
export function getFrameworkStats(framework: ComplianceFramework): {
  total: number;
  implemented: number;
  partial: number;
  planned: number;
  percentage: number;
} {
  const total = framework.controls.length;
  const implemented = framework.controls.filter(c => c.status === 'implemented').length;
  const partial = framework.controls.filter(c => c.status === 'partial').length;
  const planned = framework.controls.filter(c => c.status === 'planned').length;
  const percentage = Math.round(((implemented + partial * 0.5) / total) * 100);

  return { total, implemented, partial, planned, percentage };
}

/**
 * Subprocessor registry for DPA tracking
 */
export const subprocessors = [
  {
    name: 'Supabase',
    purpose: 'Database, authentication, edge functions',
    dataTypes: ['All user data', 'Authentication credentials', 'Session data'],
    location: 'US (AWS)',
    dpaStatus: 'active' as const,
  },
  {
    name: 'OpenAI',
    purpose: 'AI analysis and content generation',
    dataTypes: ['Memory context', 'Assessment responses', 'Business context'],
    location: 'US',
    dpaStatus: 'active' as const,
  },
  {
    name: 'Stripe',
    purpose: 'Payment processing',
    dataTypes: ['User ID', 'Subscription status', 'Payment method (tokenized)'],
    location: 'US',
    dpaStatus: 'active' as const,
  },
  {
    name: 'Resend',
    purpose: 'Transactional email delivery',
    dataTypes: ['Email address', 'Notification content'],
    location: 'US',
    dpaStatus: 'active' as const,
  },
];
