/** Public service API. UI code should import only from here. */
export { authAdapter, DEMO_OWNER_ID } from './authAdapter'
export type { AuthAdapter } from './authAdapter'
export {
  getEvents,
  getEventById,
  searchEvents,
  getOrganizerEvents,
  createEvent,
  updateEvent,
  cancelEvent,
  defaultFilters,
} from './eventService'
export { createRSVP, cancelRSVP, getMyEvents } from './rsvpService'
export type { MyEventEntry } from './rsvpService'
export { getCommunities, getCommunityById, followCommunity, unfollowCommunity } from './communityService'
export type { CommunityWithState } from './communityService'
export { getOrganizerAnalytics } from './analyticsService'
export { extractEventFromPoster } from './posterExtraction'
export { subscribeChange, getVersion } from './bus'
export {
  getCommunityPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  getPostComments,
  createPostComment,
  deletePostComment,
  reportPost,
  getOrganizations,
  getOrganizationById,
  followOrganization,
  unfollowOrganization,
  getCurrentUserId,
} from './communityPostService'
export type { CommunityFeedOptions } from './communityPostService'
export { supabase, isSupabaseConfigured } from '../lib/supabase'

