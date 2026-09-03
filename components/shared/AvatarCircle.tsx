import React from 'react';

const PASTEL_COLORS = [
  { bg: 'bg-[#E4EFE7]', text: 'text-[#2F6B4F]' }, // Green
  { bg: 'bg-[#F6E4DA]', text: 'text-[#B4491F]' }, // Terracotta
  { bg: 'bg-[#E0E7FF]', text: 'text-[#3730A3]' }, // Indigo
  { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' }, // Amber
  { bg: 'bg-[#FCE7F3]', text: 'text-[#9D174D]' }, // Rose
  { bg: 'bg-[#E2E8F0]', text: 'text-[#334155]' }, // Slate
];

interface AvatarCircleProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarCircle({ name, size = 'md', className = '' }: AvatarCircleProps) {
  // Deterministic color based on name hash
  const trimmed = name?.trim() || '?';
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % PASTEL_COLORS.length;
  const color = PASTEL_COLORS[colorIndex];

  const firstLetter = trimmed.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
  }[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 select-none ${sizeClasses} ${color.bg} ${color.text} ${className}`}
    >
      {firstLetter}
    </div>
  );
}
