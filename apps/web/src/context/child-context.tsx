'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { apiFetch } from '@/lib/api/client';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  relation: string;
  enrollments: any[];
}

interface ChildContextType {
  children: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child) => void;
  loading: boolean;
}

const ChildContext = createContext<ChildContextType>({
  children: [],
  activeChild: null,
  setActiveChild: () => {},
  loading: false,
});

export function ChildProvider({ children }: { children: React.ReactNode }) {
  const { user, activeSchoolId } = useAuth();
  const [childList, setChildList] = useState<Child[]>([]);
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchChildren() {
      if (!user || !activeSchoolId) {
        if (active) {
          setChildList([]);
          setActiveChildState(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const data = await apiFetch('/parent/children');
        if (!active) return;
        setChildList(data);

        if (data.length > 0) {
          const savedChildId = localStorage.getItem(`activeChild_${activeSchoolId}`);
          const foundChild = data.find((child: Child) => child.id === savedChildId);
          setActiveChildState(foundChild || data[0]);
        } else {
          setActiveChildState(null);
        }
      } catch {
        if (!active) return;
        setChildList([]);
        setActiveChildState(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchChildren();

    return () => {
      active = false;
    };
  }, [user, activeSchoolId]);

  const setActiveChild = (child: Child) => {
    setActiveChildState(child);
    if (activeSchoolId) {
      localStorage.setItem(`activeChild_${activeSchoolId}`, child.id);
    }
  };

  return (
    <ChildContext.Provider value={{ children: childList, activeChild, setActiveChild, loading }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  return useContext(ChildContext);
}
