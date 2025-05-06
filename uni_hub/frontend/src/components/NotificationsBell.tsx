import React from "react";

type NotificationsBellProps = React.ComponentPropsWithoutRef<'button'> & {
  hasNewNotifications: boolean;
};

export const NotificationsBell = React.forwardRef<HTMLButtonElement, NotificationsBellProps>(
  ({ hasNewNotifications, ...props }, ref) => {
    return (
        <button
        ref={ref}
        {...props}
        className="relative inline-flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="sr-only">View notifications</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.25 17.25h-4.5a.75.75 0 00-.75.75v.25a2.25 2.25 0 004.5 0v-.25a.75.75 0 00-.75-.75zm4.5-3V11a6.75 6.75 0 10-13.5 0v3.25a2.25 2.25 0 01-.659 1.591L3.5 17.25h17l-1.341-1.409a2.25 2.25 0 01-.659-1.591z"
          />
        </svg>
        {hasNewNotifications && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>      
    );
  }
);

NotificationsBell.displayName = "NotificationsBell";