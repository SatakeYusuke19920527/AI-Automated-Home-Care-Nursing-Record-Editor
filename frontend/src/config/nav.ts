import { NavItem } from '@/types/types';
import { BookOpenCheck, LayoutDashboard, Rocket } from 'lucide-react';

export const navItems: NavItem[] = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Recording',
    href: '/dashboard/recording',
    icon: Rocket,
  },
  {
    title: 'Summary',
    href: '/dashboard/summary',
    icon: BookOpenCheck,
  },
];
