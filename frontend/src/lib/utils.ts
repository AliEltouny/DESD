import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with Tailwind CSS, handling conflicts properly
 * Uses clsx for conditional class names and tailwind-merge for proper merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into a human-readable format
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format a count number with appropriate suffix (K, M)
 */
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Safely truncate a string to a maximum length with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Generate random hex color based on a string (for avatars, etc.)
 */
export function stringToColor(str: string): string {
  if (!str) return '#6366F1'; // Default to indigo if no string
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  
  return color;
}

/**
 * Get initials from a name string (e.g. "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
} 