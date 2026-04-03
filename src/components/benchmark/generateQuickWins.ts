import { dimensionLabels } from './types';
import type { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

export function generateQuickWins(
  results: AggregatedLeaderResults,
  contactData?: { roleTitle?: string; companyName?: string; companySize?: string; industry?: string }
): Array<{ title: string; impact: string; timeToValue: string }> {
  const wins: Array<{ title: string; impact: string; timeToValue: string }> = [];

  const role = contactData?.roleTitle || 'leader';
  const company = contactData?.companyName || 'your organization';
  const size = contactData?.companySize || 'similar-sized';
  const industry = contactData?.industry || 'your industry';

  // Win 1: From first move if available - make it personal and urgent
  if (results.firstMoves.length > 0) {
    const firstMove = results.firstMoves[0];
    const actionPhrase = firstMove.content.split('.')[0];
    wins.push({
      title: `Your Priority: ${actionPhrase}`,
      impact: `As ${role}, ${firstMove.content} This is your highest-leverage move right now.`,
      timeToValue: '1-2 weeks'
    });
  }

  // Win 2: From lowest dimension score - contextualize to their role
  const sortedDimensions = [...results.dimensionScores].sort((a, b) => a.score_numeric - b.score_numeric);
  if (sortedDimensions.length > 0) {
    const lowestDim = sortedDimensions[0];
    const dimLabel = dimensionLabels[lowestDim.dimension_key] || lowestDim.dimension_key;
    const score = Math.round(lowestDim.score_numeric);

    const improvementMap: Record<string, { title: string; impact: string }> = {
      ai_fluency: {
        title: `Your ${dimLabel} Gap Is Costing You 8+ Hours/Week`,
        impact: `As ${role} at ${company}, your ${score}/100 ${dimLabel} score means you're manually doing work that 73% of ${industry} leaders have automated. Commit to 30 minutes daily practicing AI tools in your actual workflow. Within 2 weeks: reclaim 5-8 hours weekly.`
      },
      decision_velocity: {
        title: `Accelerate Decisions: Cut ${dimLabel} Time by 40%`,
        impact: `With ${dimLabel} at ${score}/100, you're spending 2-3x longer on decisions than peers. Use AI to pre-analyze options before meetings. Generate tradeoff matrices and stakeholder impact assessments. For ${role}s at ${size} companies, this typically saves 6-10 hours weekly.`
      },
      experimentation_cadence: {
        title: `Launch Your First AI Pilot This Month`,
        impact: `Your ${dimLabel} score (${score}/100) shows you're theorizing instead of learning. Pick one repetitive process at ${company}, test an AI solution for 2 weeks, measure time saved. 68% of ${industry} leaders who started small pilots saw 40%+ time savings within 30 days.`
      },
      delegation_augmentation: {
        title: `Automate Your Biggest Time-Waster Now`,
        impact: `${dimLabel} at ${score}/100 indicates serious delegation gaps. As ${role}, identify your most time-consuming repetitive task and automate it using AI. Most ${industry} executives reclaim 5-8 hours weekly within 2-3 weeks of focused automation.`
      },
      alignment_communication: {
        title: `Fix Stakeholder Misalignment in 1 Week`,
        impact: `With ${dimLabel} at ${score}/100, you're losing momentum to communication friction. Build AI-powered templates for stakeholder updates at ${company} to address their specific priorities using their language. Reduce alignment meetings by 30% and accelerate approvals.`
      },
      risk_governance: {
        title: `Prevent Future AI Crises: Draft Policy Today`,
        impact: `Your ${dimLabel} score (${score}/100) means unmanaged risk is accumulating. At ${company}, draft a one-page AI usage policy covering data sensitivity and tool standards. This takes 2 hours now but prevents months of cleanup later when shadow AI creates problems.`
      }
    };

    const improvement = improvementMap[lowestDim.dimension_key];
    if (improvement) {
      wins.push({
        title: improvement.title,
        impact: improvement.impact,
        timeToValue: '2-3 weeks'
      });
    }
  }

  // Win 3: From risk signal if available - make it concrete and urgent
  if (results.riskSignals.length > 0 && wins.length < 3) {
    const topRisk = results.riskSignals[0];
    const riskWinMap: Record<string, { title: string; impact: string }> = {
      skills_gap: {
        title: 'Close Your Team\'s AI Skills Gap Fast',
        impact: `As ${role}, your team's capability gaps are slowing adoption. Focus training on the 3 tools most relevant to ${industry}. Most teams see 50%+ proficiency within 3 weeks of targeted upskilling.`
      },
      shadow_ai: {
        title: 'Discover & Secure Hidden AI Tools',
        impact: `Shadow AI is proliferating at ${company}. Conduct a 1-hour team inventory of current AI tools, then standardize on secure, approved solutions. This prevents future security incidents and improves ROI tracking.`
      },
      roi_leakage: {
        title: 'Start Tracking AI ROI This Week',
        impact: `You're generating AI value but not capturing it. As ${role}, implement a simple weekly tracker for time saved on AI-assisted tasks. Within 2 weeks you'll have concrete ROI data to justify scaled investment.`
      },
      decision_friction: {
        title: 'Map & Eliminate Decision Bottlenecks',
        impact: `At ${company}, slow decisions compound cost. Document where decisions stall, then test AI tools to accelerate analysis and consensus-building. Most ${industry} teams reduce decision time by 35-50%.`
      }
    };

    const riskWin = riskWinMap[topRisk.risk_key as keyof typeof riskWinMap];
    if (riskWin) {
      wins.push({
        title: riskWin.title,
        impact: riskWin.impact,
        timeToValue: '3-4 weeks'
      });
    }
  }

  return wins.slice(0, 3); // Max 3 quick wins
}
