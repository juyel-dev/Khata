import React from 'react';
import {
  BookOpen,
  Store,
  Wallet,
  Users,
  ShoppingCart,
  Briefcase,
  PiggyBank,
  Home,
  FileText,
  LucideProps,
} from 'lucide-react';

interface IconHelperProps extends LucideProps {
  name: string;
}

export function IconHelper({ name, ...props }: IconHelperProps) {
  switch (name) {
    case 'store':
      return <Store {...props} />;
    case 'wallet':
      return <Wallet {...props} />;
    case 'users':
      return <Users {...props} />;
    case 'shopping-cart':
    case 'cart':
      return <ShoppingCart {...props} />;
    case 'briefcase':
      return <Briefcase {...props} />;
    case 'piggy-bank':
      return <PiggyBank {...props} />;
    case 'home':
      return <Home {...props} />;
    case 'book':
    default:
      return <BookOpen {...props} />;
  }
}
