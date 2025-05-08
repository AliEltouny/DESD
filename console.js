Console Error

API Error Response: {}

src/services/api/apiClient.ts (75:15) @ <unknown>

  73 |     // Only log errors that aren't 404s on membership_status endpoints
  74 |     if (!(isMembershipStatusEndpoint && is404Error)) {
> 75 |       console.error("API Error Response:", {
     |               ^
  76 |         status: error.response?.status || 'unknown',
  77 |         statusText: error.response?.statusText || 'unknown',
  78 |         data: error.response?.data ? 

Call Stack 19
Show 15 ignore-listed frame(s)
<unknown>
src/services/api/apiClient.ts (75:15)
joinCommunity
src/services/api/community/communityApi.ts (391:34)
useEnhancedJoinCommunity.useCallback[joinCommunity]
src/hooks/communities/useEnhancedJoinCommunity.ts (30:43)
handleJoinClick
src/components/communities/slugPage/CommunityHeader.tsx (129:30), 
Console Error

Join community error details: {}

src/services/api/community/communityApi.ts (410:17) @ joinCommunity

  408 |       // Enhanced error logging
  409 |       if (axios.isAxiosError(error)) {
> 410 |         console.error("Join community error details:", {
      |                 ^
  411 |           status: error.response?.status || 'unknown',
  412 |           data: error.response?.data ? 
  413 |             (typeof error.response.data === 'object' ?

Call Stack 14
Show 11 ignore-listed frame(s)
joinCommunity
src/services/api/community/communityApi.ts (410:17)
async*useEnhancedJoinCommunity.useCallback[joinCommunity]
src/hooks/communities/useEnhancedJoinCommunity.ts (30:43)
handleJoinClick
src/components/communities/slugPage/CommunityHeader.tsx (129:30),
Console Error

API Error Response: {}

src/services/api/apiClient.ts (75:15) @ <unknown>

  73 |     // Only log errors that aren't 404s on membership_status endpoints
  74 |     if (!(isMembershipStatusEndpoint && is404Error)) {
> 75 |       console.error("API Error Response:", {
     |               ^
  76 |         status: error.response?.status || 'unknown',
  77 |         statusText: error.response?.statusText || 'unknown',
  78 |         data: error.response?.data ? 

Call Stack 20
Show 15 ignore-listed frame(s)
<unknown>
src/services/api/apiClient.ts (75:15)
joinCommunity
src/services/api/community/communityApi.ts (391:34)
useApi.useCallback[execute]
src/hooks/useApi.ts (49:45)
handleJoin
src/app/communities/[slug]/page.tsx (308:30)
async*handleJoinClick
src/components/communities/slugPage/CommunityHeader.tsx (137:13),
Console Error

Join community error details: {}

src/services/api/community/communityApi.ts (410:17) @ joinCommunity

  408 |       // Enhanced error logging
  409 |       if (axios.isAxiosError(error)) {
> 410 |         console.error("Join community error details:", {
      |                 ^
  411 |           status: error.response?.status || 'unknown',
  412 |           data: error.response?.data ? 
  413 |             (typeof error.response.data === 'object' ?

Call Stack 15
Show 11 ignore-listed frame(s)
joinCommunity
src/services/api/community/communityApi.ts (410:17)
async*useApi.useCallback[execute]
src/hooks/useApi.ts (49:45)
handleJoin
src/app/communities/[slug]/page.tsx (308:30)
async*handleJoinClick
src/components/communities/slugPage/CommunityHeader.tsx (137:13)