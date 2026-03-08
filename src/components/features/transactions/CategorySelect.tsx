'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  categoryGroupId: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  categories: Category[];
}

interface CategorySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CategorySelect({ value, onValueChange, placeholder = 'Select category' }: CategorySelectProps) {
  const handleValueChange = (newValue: string | null) => {
    onValueChange(newValue || '');
  };
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/category-groups');
        if (res.ok) {
          const data = await res.json();
          setCategoryGroups(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading categories..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categoryGroups.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel>{group.name}</SelectLabel>
            {group.categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        <SelectGroup>
          <SelectLabel>Other</SelectLabel>
          <SelectItem value="">Uncategorized</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
