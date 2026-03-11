'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const commonEmojis = [
  '📁', '🏠', '🚗', '🍔', '💰', '🎮', '📱', '⚡', '💡', '🎯',
  '🛒', '💳', '🏥', '✈️', '🎓', '🎵', '📚', '🎨', '🏋️', '🍿',
  '☕', '🍕', '🎁', '🌟', '🔧', '💼', '👕', '🏦', '⛽', '🍎',
];

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              'text-2xl p-2 rounded hover:bg-muted transition-colors',
              value === emoji && 'bg-primary/20 ring-2 ring-primary'
            )}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Or type:
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type emoji"
          className="w-24"
          maxLength={2}
        />
      </div>
    </div>
  );
}
