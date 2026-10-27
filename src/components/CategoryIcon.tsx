/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  HandCoins,
  Gift,
  Coins,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  GraduationCap,
  HeartPulse,
  Gamepad2,
  Plane,
  Sparkles,
  Receipt,
  Coffee,
  Fuel,
  Film,
  Music,
  Dumbbell,
  BookOpen,
  Smartphone,
  Tag,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';
import { Category } from '../types/finance.ts';

export const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  HandCoins,
  Gift,
  Coins,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  GraduationCap,
  HeartPulse,
  Gamepad2,
  Plane,
  Sparkles,
  Receipt,
  Coffee,
  Fuel,
  Film,
  Music,
  Dumbbell,
  BookOpen,
  Smartphone,
  Tag,
  CircleDollarSign,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'size-4',
  size = 16,
  color,
}) => {
  const IconComponent = ICON_MAP[name] || Receipt;
  return (
    <IconComponent
      className={className}
      size={size}
      style={color ? { color } : undefined}
      aria-hidden="true"
    />
  );
};

type AvatarSize = 'sm' | 'md' | 'lg';

const AVATAR_SIZES: Record<AvatarSize, { box: string; icon: number }> = {
  sm: { box: 'size-7', icon: 14 },
  md: { box: 'size-9', icon: 17 },
  lg: { box: 'size-10', icon: 18 },
};

interface CategoryAvatarProps {
  category?: Pick<Category, 'icon' | 'color'> | null;
  size?: AvatarSize;
  className?: string;
}

/**
 * A hard-edged icon tile. Category color lives in the glyph while the tile
 * keeps the same black outline as the rest of the surface.
 */
export const CategoryAvatar: React.FC<CategoryAvatarProps> = ({
  category,
  size = 'md',
  className = '',
}) => {
  const color = category?.color || '#7f8c81';
  const { box, icon } = AVATAR_SIZES[size];

  return (
    <span
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-none border-2 border-ink bg-surface-2 ${className}`}
      style={{ color }}
      aria-hidden="true"
    >
      <CategoryIcon name={category?.icon || 'Receipt'} size={icon} />
    </span>
  );
};
