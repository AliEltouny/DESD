# Testing UniHub Community Membership Functionality

This document outlines testing procedures to verify the community membership functionality works correctly after our recent fixes.

## Prerequisites

- Multiple test user accounts with different roles (admin, moderator, regular user)
- At least 2-3 test communities with different settings (public/private, requires approval/direct join)
- Access to browser developer tools for monitoring network requests
- Optional: A way to simulate network issues (throttling, disconnection)

## Testing Scenarios

### 1. Basic Membership Status Viewing

| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| Anonymous user visits community | 1. Sign out of all accounts<br>2. Visit a public community page | - "Join Community" button visible<br>- No membership status shown<br>- No errors in console |
| Authenticated user visits community (not a member) | 1. Sign in<br>2. Visit a community they're not part of | - "Join Community" button visible<br>- Membership status shows as "Not a member"<br>- No errors in console |
| Authenticated user visits community (member) | 1. Sign in<br>2. Visit a community they're part of | - "Leave Community" button visible<br>- Membership status shows as "Member" or appropriate role<br>- Member-only content visible<br>- No errors in console |

### 2. Join Community Tests

| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| Join public community (direct join) | 1. Sign in as a regular user<br>2. Visit a public community that doesn't require approval<br>3. Click "Join Community" button | - Button changes to "Leave Community"<br>- Membership status updates to "Member"<br>- Success notification appears<br>- No page reload required<br>- No errors in console |
| Join private community (requires approval) | 1. Sign in as a regular user<br>2. Visit a private community that requires approval<br>3. Click "Join Community" button | - Button state changes<br>- Membership status updates to "Pending"<br>- Success notification indicates pending approval<br>- No page reload required<br>- No errors in console |
| Join community with slow network | 1. Enable network throttling in developer tools<br>2. Sign in as a regular user<br>3. Visit a community<br>4. Click "Join Community" button | - Loading indicator appears<br>- Eventually resolves successfully<br>- Appropriate retry logic activates if needed<br>- No errors in console |
| Join community during network failure | 1. Sign in as a regular user<br>2. Visit a community<br>3. Disable network connection<br>4. Click "Join Community" button<br>5. Re-enable network<br>6. Try retry button if shown | - Error message appears with retry option<br>- After network restored, retry works<br>- Eventually resolves without page reload<br>- No unexpected errors in console |

### 3. Leave Community Tests

| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| Leave community as regular member | 1. Sign in as a regular member<br>2. Visit a community they're part of<br>3. Click "Leave Community" button | - Button changes to "Join Community"<br>- Membership status updates to "Not a member"<br>- Success notification appears<br>- No page reload required<br>- No errors in console |
| Leave community as admin (multiple admins) | 1. Sign in as an admin<br>2. Visit a community with multiple admins<br>3. Click "Leave Community" button | - Successfully leaves community<br>- Membership status updates<br>- No errors in console |
| Leave community as sole admin | 1. Sign in as the only admin<br>2. Visit the community<br>3. Click "Leave Community" button | - Error message explains they can't leave<br>- Remains an admin<br>- Suggests making another user admin first<br>- No unexpected errors in console |
| Leave community with slow network | 1. Enable network throttling in developer tools<br>2. Sign in as a member<br>3. Visit a community<br>4. Click "Leave Community" button | - Loading indicator appears<br>- Eventually resolves successfully<br>- Appropriate retry logic activates if needed<br>- No errors in console |

### 4. Error Handling Tests

| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| Backend validation error | 1. Modify API request to trigger a validation error<br>(e.g., attempt to join a community already joined) | - Proper error message displayed<br>- UI doesn't break<br>- Console shows meaningful error info |
| Server error (500) | 1. Configure a community to trigger a 500 error<br>2. Attempt to join/leave | - Retry mechanism activates<br>- User-friendly error displayed<br>- UI remains functional<br>- Detailed logs in console |
| Connection timeout | 1. Set up extreme network latency<br>2. Attempt to join/leave | - Request eventually times out<br>- Timeout error displayed<br>- Retry option provided<br>- Detailed logs in console |
| API format changes | 1. Modify API response format temporarily<br>2. Attempt membership actions | - Fallback values used<br>- UI remains stable<br>- Errors handled gracefully |

### 5. Edge Cases and Special Scenarios

| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| Concurrent actions | 1. Rapidly click join/leave buttons<br>2. Try to perform actions in multiple tabs | - Only one action processed<br>- No duplicate memberships<br>- UI state consistent across tabs<br>- No errors in console |
| Browser refresh during action | 1. Click join/leave button<br>2. Immediately refresh page | - Action either completes or cancels cleanly<br>- No orphaned requests<br>- Membership status correct after refresh |
| Session expiration | 1. Let session expire<br>2. Attempt membership action | - User redirected to login<br>- Clear message explaining what happened<br>- After login, returns to same page |
| Community deletion | 1. Join a community<br>2. Have another user delete it<br>3. Refresh page | - Graceful handling of missing community<br>- Clear error message<br>- No console errors |

## Testing Matrix

Use this table to track testing across different environments:

| Test Case | Chrome | Firefox | Safari | Mobile | Network Throttled | Result |
|-----------|--------|---------|--------|--------|-------------------|--------|
| Anonymous viewing | | | | | | |
| Member viewing | | | | | | |
| Join public | | | | | | |
| Join private | | | | | | |
| Leave as member | | | | | | |
| Leave as admin | | | | | | |
| Error handling | | | | | | |
| Edge cases | | | | | | |

## Identifying Success

The community membership functionality can be considered working correctly when:

1. All test cases pass without errors in browser console
2. Users can successfully join and leave communities
3. UI accurately reflects membership status at all times
4. Error cases are handled gracefully with helpful messages
5. Network issues don't break the functionality
6. Actions are completed atomically without partial states
7. Server logs show proper handling of all requests

## Bug Reporting Template

If issues are found, use this template to report them:

```
Bug: [Brief description]
Test Case: [Which test case revealed the bug]
Environment: [Browser, OS, network conditions]
Steps to Reproduce:
1. 
2.
3.

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Console Errors:
[Any errors from developer console]

Screenshots:
[If applicable]
``` 