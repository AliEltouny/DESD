import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MemberCard from '../MemberCard';
import { CommunityMember } from '@/types/api';

// Mock the api helper functions
jest.mock('@/services/api', () => ({
  getMediaUrl: jest.fn((url) => url ? `https://example.com/media/${url}` : null),
}));

describe('MemberCard Component', () => {
  // Test member data
  const mockMember: CommunityMember = {
    id: 123,
    user: {
      id: 456,
      username: 'testuser',
      full_name: 'Test User',
      email: 'test@example.com',
      avatar: 'avatar.jpg'
    },
    role: 'admin',
    status: 'approved',
    joined_at: '2023-04-15T12:00:00Z',
    community: 1
  };

  test('renders member information correctly', () => {
    render(<MemberCard member={mockMember} />);
    
    // Check that basic member info is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    
    // Check role badge
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('shows member status badge if not approved', () => {
    const pendingMember = {
      ...mockMember,
      status: 'pending'
    };
    
    render(<MemberCard member={pendingMember} />);
    
    // Check that status badge is shown
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('displays join date when showJoinDate is true', () => {
    render(<MemberCard member={mockMember} showJoinDate={true} />);
    
    // Check that join date is displayed
    expect(screen.getByText(/Joined Apr 15, 2023/)).toBeInTheDocument();
  });

  test('does not display join date when showJoinDate is false', () => {
    render(<MemberCard member={mockMember} showJoinDate={false} />);
    
    // Join date should not be in the document
    expect(screen.queryByText(/Joined/)).not.toBeInTheDocument();
  });

  test('highlights current user with You badge', () => {
    render(<MemberCard member={mockMember} isCurrentUser={true} />);
    
    // Check for You badge
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  test('calls onClick handler when card is clicked', () => {
    const handleClick = jest.fn();
    
    render(<MemberCard member={mockMember} onClick={handleClick} />);
    
    // Click the card
    fireEvent.click(screen.getByTestId('member-card'));
    
    // Check that handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders moderator role correctly', () => {
    const moderatorMember = {
      ...mockMember,
      role: 'moderator'
    };
    
    render(<MemberCard member={moderatorMember} />);
    
    // Check moderator badge
    expect(screen.getByText('Moderator')).toBeInTheDocument();
  });

  test('renders regular member with no role badge', () => {
    const regularMember = {
      ...mockMember,
      role: 'member'
    };
    
    render(<MemberCard member={regularMember} />);
    
    // Member role badge should not be visible for regular members
    expect(screen.queryByText('Member')).not.toBeInTheDocument();
  });

  test('renders fallback for missing user data', () => {
    const incompleteUser = {
      ...mockMember,
      user: {
        ...mockMember.user,
        full_name: '',
        avatar: null
      }
    };
    
    // Need to spy on console.error to prevent test warnings
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<MemberCard member={incompleteUser} />);
    
    // Should fall back to username when full_name is missing
    expect(screen.getByText('testuser')).toBeInTheDocument();
    
    // Reset console.error mock
    jest.restoreAllMocks();
  });
}); 