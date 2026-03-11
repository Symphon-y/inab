'use client';

import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NotesSectionProps {
  categoryId: string;
  note: string | null;
  onSaveNote: (note: string) => void;
}

export function NotesSection({ categoryId, note, onSaveNote }: NotesSectionProps) {
  const [localNote, setLocalNote] = useState(note || '');

  // Update local state when note prop changes
  useEffect(() => {
    setLocalNote(note || '');
  }, [note]);

  const handleBlur = () => {
    // Only save if the note has changed
    if (localNote !== (note || '')) {
      onSaveNote(localNote);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Notes
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Add notes to remember details about this category</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Textarea
        placeholder="Enter a note..."
        value={localNote}
        onChange={(e) => setLocalNote(e.target.value)}
        onBlur={handleBlur}
        rows={3}
        className="resize-none"
      />
    </div>
  );
}
