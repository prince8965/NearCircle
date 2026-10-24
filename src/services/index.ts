/** Public service API. UI code should import only from here. */
export { authAdapter, DEMO_OWNER_ID } from './authAdapter'
export type { AuthAdapter, SignUpOptions } from './authAdapter'
export {
  getEvents,
  getEventById,
  searchEvents,
  searchHackathons,
  getOrganizationCompletedEventsCount,
  getOrganizationPublicEvents,
  getOrganizerEvents,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteDraftEvent,
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
  getOrganizationByOwnerId,
  createOrganization,
  updateOrganization,
  followOrganization,
  unfollowOrganization,
  getCurrentUserId,
} from './communityPostService'
export type { CommunityFeedOptions } from './communityPostService'
export {
  registerForEvent,
  cancelRegistration,
  getRegistrationForEvent,
  getMyRegistrations,
  getEventAttendees,
  updateAttendeeStatus,
} from './registrationService'
export {
  createTeam,
  joinTeamByInviteCode,
  getTeamForEvent,
  getTeamById,
  inviteTeamMember,
  getMyPendingInvites,
  respondToInvite,
  removeTeamMember,
  leaveTeam,
  disbandTeam,
} from './teamService'
export { supabase, isSupabaseConfigured } from '../lib/supabase'

