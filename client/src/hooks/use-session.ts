import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface SessionData {
  isAuthenticated: boolean;
  user: User | null;
}

export function useSession() {
  const { data, isLoading, error } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to check session');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    isAuthenticated: data?.isAuthenticated ?? false,
    user: data?.user ?? null,
    isLoading,
    error,
  };
}