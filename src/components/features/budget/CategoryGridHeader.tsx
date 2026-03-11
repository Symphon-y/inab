'use client';

export function CategoryGridHeader() {
  return (
    <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-muted/20 border-b sticky top-0 z-10">
      {/* Category column */}
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Category
      </div>

      {/* Assigned column */}
      <div className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Assigned
      </div>

      {/* Activity column */}
      <div className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Activity
      </div>

      {/* Available column */}
      <div className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Available
      </div>
    </div>
  );
}
