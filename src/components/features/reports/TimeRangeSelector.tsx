'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface TimeRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type Preset = 'last30' | 'last3months' | 'last6months' | 'lastYear' | 'ytd' | 'allTime' | 'custom';

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const [preset, setPreset] = useState<Preset>('last3months');

  const getPresetRange = (preset: Preset): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'last30':
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate: today,
        };
      case 'last3months':
        return {
          startDate: new Date(today.getFullYear(), today.getMonth() - 3, 1),
          endDate: today,
        };
      case 'last6months':
        return {
          startDate: new Date(today.getFullYear(), today.getMonth() - 6, 1),
          endDate: today,
        };
      case 'lastYear':
        return {
          startDate: new Date(today.getFullYear(), today.getMonth() - 12, 1),
          endDate: today,
        };
      case 'ytd':
        return {
          startDate: new Date(today.getFullYear(), 0, 1),
          endDate: today,
        };
      case 'allTime':
        return {
          startDate: new Date(2000, 0, 1),
          endDate: today,
        };
      default:
        return value;
    }
  };

  const handlePresetChange = (newPreset: Preset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const range = getPresetRange(newPreset);
      onChange(range);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Time Range</label>
          <Select value={preset} onValueChange={(v) => handlePresetChange(v as Preset)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {preset === 'custom' && (
          <div className="flex gap-2 items-end flex-1">
            <div className="flex-1">
              <label htmlFor="start-date" className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={value.startDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newStartDate = new Date(e.target.value);
                  onChange({ ...value, startDate: newStartDate });
                }}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="end-date" className="text-sm font-medium mb-2 block">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={value.endDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newEndDate = new Date(e.target.value);
                  onChange({ ...value, endDate: newEndDate });
                }}
              />
            </div>
          </div>
        )}

        {preset !== 'custom' && (
          <div className="text-sm text-muted-foreground">
            {formatDate(value.startDate)} - {formatDate(value.endDate)}
          </div>
        )}
      </div>
    </Card>
  );
}
