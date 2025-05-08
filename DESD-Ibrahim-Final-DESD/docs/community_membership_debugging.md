# Troubleshooting UniHub Community Membership Issues

This guide helps identify and fix community membership-related issues in the UniHub platform.

## Common Error Patterns

### 1. Membership Status Errors

| Error Symptom | Possible Causes | Troubleshooting Steps |
|---------------|-----------------|----------------------|
| "Failed to fetch membership status" | - Network connectivity issues<br>- Backend API error<br>- URL mismatch | 1. Check network console for specific error<br>2. Verify endpoint URL format (trailing slash)<br>3. Check backend logs for errors<br>4. Try clearing browser cache |
| Console error with `membership_status` endpoint | - Incorrect URL format<br>- Authentication issue<br>- CORS configuration | 1. Verify URL matches `/api/communities/{slug}/membership_status/`<br>2. Check user authentication state<br>3. Verify CORS headers in response |
| Membership shows as null despite being a member | - Race condition in API calls<br>- Cache inconsistency<br>- Frontend state management issue | 1. Check useMembershipStatus hook in React devtools<br>2. Verify backend response data<br>3. Clear frontend caches<br>4. Check if invalidateQueries is working (React Query) |

### 2. Join Community Errors

| Error Symptom | Possible Causes | Troubleshooting Steps |
|---------------|-----------------|----------------------|
| "Failed to join community" generic error | - Network issue<br>- Backend validation error<br>- Permission issue | 1. Check network tab for status code<br>2. Review backend logs for specific validation error<br>3. Verify user permissions |
| Join button remains in loading state | - Failed API request without error handling<br>- Frontend state management bug | 1. Check if isJoining state is stuck<br>2. Verify joinStatus in React devtools<br>3. Try manual state reset |
| Request timeout when joining | - Backend processing delay<br>- Network latency<br>- Server overload | 1. Check if retry mechanism activated<br>2. Review backend performance metrics<br>3. Verify timeout settings in API client |

### 3. Leave Community Errors

| Error Symptom | Possible Causes | Troubleshooting Steps |
|---------------|-----------------|----------------------|
| "Cannot leave as sole admin" error | - User is the only admin<br>- Business rule enforced | 1. This is expected behavior<br>2. Make another user admin first |
| Leave request succeeds but UI doesn't update | - Cache invalidation issue<br>- Race condition in state updates | 1. Verify response in network tab<br>2. Check if cache invalidation is called<br>3. Test with cache disabled |
| Multiple leave requests sent | - Button debounce issue<br>- Concurrent requests not handled | 1. Check click handlers for proper disabling<br>2. Verify leaveStatus management<br>3. Test button disabled state during request |

### 4. React Query Integration Errors

| Error Symptom | Possible Causes | Troubleshooting Steps |
|---------------|-----------------|----------------------|
| `useQueryClient` error in console | - Missing QueryClientProvider<br>- React Query import issues | 1. Check if QueryClientProvider wraps the app<br>2. Verify React Query installation<br>3. Check if the hook handles missing provider |
| Cache invalidation doesn't work | - QueryClient not available<br>- Invalid query keys | 1. Verify query key structure<br>2. Check if queryClient is null<br>3. Add debug logs before invalidation |
| React Query related exceptions | - Version compatibility issues<br>- Hook order violations | 1. Check React Query version<br>2. Ensure hooks are used at component top level<br>3. Verify hook implementation |

## Where to Look for Logs

1. **Browser Console**:
   - API request/response logs with unique request IDs
   - Error details with stack traces
   - Status messages from membership operations

2. **Network Tab**:
   - Request URLs (verify correct format with trailing slashes)
   - Request headers (check Authorization, X-Request-Type)
   - Response status codes and data

3. **Backend Logs**:
   - Django server logs with membership operation details
   - Detailed error traces in membership_status view
   - Join/leave community operation logs
   - Database query information

## Common Fixes

### Frontend Fixes

1. **URL Format Issues**:
   ```javascript
   // Incorrect
   const endpoint = `/api/communities/${slug}/membership_status`;
   
   // Correct
   const endpoint = `/api/communities/${slug}/membership_status/`;
   ```

2. **Error Handling Improvement**:
   ```javascript
   // Add proper fallback
   return handleApiError<MembershipStatus>(error, `fetching membership status for ${slug}`, {
     fallbackValue: { is_member: false, status: null, role: null },
     rethrow: false,
     defaultMessage: "Failed to get membership status."
   });
   ```

3. **State Management Fix**:
   ```javascript
   // Safe state updates with null checks
   setIsMember(membershipStatus?.is_member ?? false);
   setDerivedStatus(membershipStatus?.status ?? null);
   ```

### Backend Fixes

1. **URL Configuration**:
   ```python
   # Ensure trailing slash consistency
   path('communities/<slug:slug>/membership_status/', 
        CommunityViewSet.as_view({'get': 'membership_status'}), 
        name='community-membership-status'),
   ```

2. **Error Handling Enhancement**:
   ```python
   try:
       membership = Membership.objects.get(community=community, user=user)
       return Response(serializer.data)
   except Membership.DoesNotExist:
       # Return structured response even for non-members
       return Response({
           'is_member': False,
           'status': None, 
           'role': None 
       }, status=status.HTTP_200_OK)
   ```

3. **Debug Logging Addition**:
   ```python
   print(f"Membership Status Request - User: {request.user.username}, Community Slug: {slug}")
   ```

## Performance Optimization Tips

1. **Cache Management**:
   - Use proper cache invalidation after membership changes
   - Set appropriate cache expiry times (shorter for membership data)
   - Clear specific cache keys instead of entire cache

2. **Requests Optimization**:
   - Use conditional fetching based on authentication state
   - Combine related API calls when possible
   - Implement proper request debouncing

3. **Error Recovery**:
   - Implement exponential backoff for retries
   - Add circuit breaker for repeated failures
   - Provide graceful fallbacks for all error states

## Preventive Maintenance

To prevent membership issues in the future:

1. **Regular Testing**:
   - Run the test suite from the testing document weekly
   - Test all edge cases after major updates
   - Verify membership operations across different browsers

2. **Monitoring**:
   - Add specific logging for membership operations
   - Track error rates for membership-related endpoints
   - Set up alerts for elevated error rates

3. **Code Reviews**:
   - Enforce consistent URL patterns for all API endpoints
   - Require comprehensive error handling in all API calls
   - Maintain thorough test coverage for membership features 