'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  defaultCollapsed = false,
  badge,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full text-left group"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform" />
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex-1">
          {title}
        </h3>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </button>

      {/* Content */}
      {!isCollapsed && <div className="space-y-2 pl-6">{children}</div>}
    </div>
  );
}
