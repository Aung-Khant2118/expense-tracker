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
  className = 'w-4 h-4',
  size = 16,
  color,
}) => {
  const IconComponent = ICON_MAP[name] || Receipt;
  return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
};
