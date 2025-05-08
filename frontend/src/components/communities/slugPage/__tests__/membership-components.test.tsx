import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MembershipButton from '../MembershipButton';
import MembershipStatus from '../MembershipStatus';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('MembershipStatus Component', () => {
  test('renders nothing when user is not a member', () => {
    const { container } = render(
      <MembershipStatus
        isMember={false}
        status="approved"
        role="member"
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  test('renders approved member status correctly', () => {
    render(
      <MembershipStatus
        isMember={true}
        status="approved"
        role="member"
      />
    );
    
    expect(screen.getByText('Member')).toBeInTheDocument();
  });
  
  test('renders pending member status correctly', () => {
    render(
      <MembershipStatus
        isMember={true}
        status="pending"
        role={null}
      />
    );
    
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });
  
  test('renders admin role badge correctly', () => {
    render(
      <MembershipStatus
        isMember={true}
        status="approved"
        role="admin"
      />
    );
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
  
  test('renders sidebar variant correctly', () => {
    render(
      <MembershipStatus
        isMember={true}
        status="approved"
        role="moderator"
        variant="sidebar"
      />
    );
    
    expect(screen.getByText('Membership Status')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
  });
});

describe('MembershipButton Component', () => {
  const mockJoinLeave = jest.fn();
  
  beforeEach(() => {
    mockJoinLeave.mockClear();
  });
  
  test('renders join button when not a member', () => {
    render(
      <MembershipButton
        slug="test-community"
        isMember={false}
        membershipStatus={null}
        isProcessing={false}
        onJoinLeave={mockJoinLeave}
      />
    );
    
    const button = screen.getByText('Join Community');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(mockJoinLeave).toHaveBeenCalledTimes(1);
  });
  
  test('renders request to join button when community requires approval', () => {
    render(
      <MembershipButton
        slug="test-community"
        isMember={false}
        membershipStatus={null}
        isProcessing={false}
        requiresApproval={true}
        onJoinLeave={mockJoinLeave}
      />
    );
    
    expect(screen.getByText('Request to Join')).toBeInTheDocument();
  });
  
  test('renders pending approval when status is pending', () => {
    render(
      <MembershipButton
        slug="test-community"
        isMember={true}
        membershipStatus="pending"
        isProcessing={false}
        onJoinLeave={mockJoinLeave}
      />
    );
    
    const button = screen.getByText('Pending Approval');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
  
  test('renders leave button when user is a member', () => {
    render(
      <MembershipButton
        slug="test-community"
        isMember={true}
        membershipStatus="approved"
        isProcessing={false}
        onJoinLeave={mockJoinLeave}
      />
    );
    
    const button = screen.getByText('Leave Community');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(mockJoinLeave).toHaveBeenCalledTimes(1);
  });
  
  test('renders processing state correctly', () => {
    render(
      <MembershipButton
        slug="test-community"
        isMember={false}
        membershipStatus={null}
        isProcessing={true}
        onJoinLeave={mockJoinLeave}
      />
    );
    
    const button = screen.getByText('Processing...');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
  
  test('does not render when user is not authenticated', () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockImplementationOnce(() => ({
      isAuthenticated: false
    }));
    
    const { container } = render(
      <MembershipButton
        slug="test-community"
        isMember={false}
        membershipStatus={null}
        isProcessing={false}
        onJoinLeave={mockJoinLeave}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  test('renders different variants with appropriate styles', () => {
    const { rerender } = render(
      <MembershipButton
        slug="test-community"
        isMember={false}
        membershipStatus={null}
        isProcessing={false}
        onJoinLeave={mockJoinLeave}
        variant="header"
      />
    );
    
    // Header variant should have rounded-full class
    let button = screen.getByRole('button');
    expect(button.className).toContain('rounded-full');
    
    // Rerender with mobile variant
    rerender(
      <MembershipButton
        slug="test-community"
        isMember={false}
        membershipStatus={null}
        isProcessing={false}
        onJoinLeave={mockJoinLeave}
        variant="mobile"
      />
    );
    
    // Mobile variant should have w-full class
    button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });
});

// Integration test for combining both components
describe('Membership Components Integration', () => {
  test('components work together with consistent styling', () => {
    const mockJoinLeave = jest.fn();
    
    render(
      <div>
        <MembershipStatus
          isMember={true}
          status="approved"
          role="admin"
          variant="sidebar"
        />
        <MembershipButton
          slug="test-community"
          isMember={true}
          membershipStatus="approved"
          isProcessing={false}
          onJoinLeave={mockJoinLeave}
        />
      </div>
    );
    
    // Status displays correctly
    expect(screen.getByText('Membership Status')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Button displays correctly
    expect(screen.getByText('Leave Community')).toBeInTheDocument();
  });
}); 