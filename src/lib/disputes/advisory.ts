import { DisputeReasonCategory, WorthFightingAdvice } from '../../types';

const ADVISORY_RULES: Record<DisputeReasonCategory, WorthFightingAdvice> = {
  'Fraud': {
    recommendation: 'Low chance',
    reasoning: 'Fraud disputes are rarely overturned without strong 3DS or AVS authentication proof',
  },
  'Product not received': {
    recommendation: 'Recommended',
    reasoning: 'High win rate when proof of delivery or shipping tracking is available',
  },
  'Not as described': {
    recommendation: 'Neutral',
    reasoning: 'Outcome depends on quality of evidence — product specs, terms, customer communication',
  },
  'Duplicate charge': {
    recommendation: 'Recommended',
    reasoning: 'Usually straightforward to prove with transaction logs showing a single charge',
  },
  'Subscription cancelled': {
    recommendation: 'Neutral',
    reasoning: 'Depends on cancellation policy clarity and timing of the request vs. charge',
  },
  'Other': {
    recommendation: 'Neutral',
    reasoning: 'Assess on a case-by-case basis — no standard pattern for this category',
  },
};

export function getWorthFightingAdvice(reasonCategory: DisputeReasonCategory): WorthFightingAdvice {
  return ADVISORY_RULES[reasonCategory];
}
