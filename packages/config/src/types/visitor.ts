/**
 * Visitor-related application types
 * Shared across API and Web applications
 * 
 * NOTE: Visitor and VisitorFollowup types are re-exported from @church/config/schema
 * These constants and type aliases are application-level only
 */

/**
 * Visitor source enum - how the visitor found us
 */
export const VISITOR_SOURCE = {
  FRIEND: 'friend',
  FLYER: 'flyer',
  WALK_IN: 'walk_in',
  EVENT: 'event',
  REFERRAL: 'referral',
  SOCIAL_MEDIA: 'social_media',
  OTHER: 'other',
} as const

export type VisitorSource = (typeof VISITOR_SOURCE)[keyof typeof VISITOR_SOURCE]

/**
 * Follow-up status enum - progression of visitor engagement
 */
export const VISITOR_FOLLOWUP_STATUS = {
  NONE: 'none',
  CALLED: 'called',
  VISITED: 'visited',
  CONVERTED: 'converted',
  DROPPED: 'dropped',
} as const

export type VisitorFollowupStatus = (typeof VISITOR_FOLLOWUP_STATUS)[keyof typeof VISITOR_FOLLOWUP_STATUS]
