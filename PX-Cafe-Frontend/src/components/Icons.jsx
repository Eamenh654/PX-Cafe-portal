import React from 'react';

export const Icons = {
  espresso: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M25 40 L28 78 Q28 85 35 85 L65 85 Q72 85 72 78 L75 40 Z"/>
      <path d="M75 50 Q88 50 88 62 Q88 74 75 74"/>
      <path d="M35 25 Q35 15 40 20 Q45 25 45 15" strokeLinecap="round"/>
      <path d="M50 22 Q50 12 55 17 Q60 22 60 12" strokeLinecap="round"/>
      <path d="M20 90 L80 90" strokeWidth="1.5"/>
    </svg>
  ),
  cappuccino: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <ellipse cx="50" cy="42" rx="28" ry="5"/>
      <path d="M22 42 L26 80 Q26 86 32 86 L68 86 Q74 86 74 80 L78 42"/>
      <path d="M78 52 Q90 52 90 64 Q90 74 78 74"/>
      <circle cx="42" cy="40" r="2" fill="currentColor"/>
      <circle cx="58" cy="40" r="2" fill="currentColor"/>
      <circle cx="50" cy="44" r="2" fill="currentColor"/>
    </svg>
  ),
  latte: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M30 25 L30 82 Q30 88 36 88 L60 88 Q66 88 66 82 L66 25 Z"/>
      <path d="M30 42 L66 42" opacity="0.5"/>
      <path d="M66 35 Q80 35 80 50 Q80 65 66 65"/>
      <path d="M42 30 Q48 33 42 38 Q48 41 42 45" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  flatwhite: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M22 45 L26 82 Q26 88 32 88 L68 88 Q74 88 74 82 L78 45 Z"/>
      <ellipse cx="50" cy="45" rx="28" ry="4"/>
      <path d="M78 55 Q88 55 88 65 Q88 73 78 73"/>
      <path d="M44 40 Q50 36 56 40 Q50 44 44 40" fill="currentColor" opacity="0.3" stroke="none"/>
    </svg>
  ),
  greentea: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M28 38 L30 80 Q30 86 36 86 L64 86 Q70 86 70 80 L72 38"/>
      <ellipse cx="50" cy="38" rx="22" ry="3"/>
      <path d="M50 30 Q45 18 50 8 Q55 18 50 30" fill="currentColor" opacity="0.4" strokeLinejoin="round"/>
      <path d="M50 15 L50 28" strokeLinecap="round"/>
    </svg>
  ),
  earlgrey: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <ellipse cx="50" cy="40" rx="26" ry="4"/>
      <path d="M24 40 L28 78 Q28 85 35 85 L65 85 Q72 85 72 78 L76 40"/>
      <path d="M76 48 Q86 48 86 58 Q86 68 76 68"/>
      <path d="M35 25 Q35 18 40 22" strokeLinecap="round" opacity="0.5"/>
      <path d="M50 22 Q50 15 55 19" strokeLinecap="round" opacity="0.5"/>
      <path d="M65 25 Q65 18 70 22" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  mint: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M30 38 L32 80 Q32 86 38 86 L62 86 Q68 86 68 80 L70 38"/>
      <ellipse cx="50" cy="38" rx="20" ry="3"/>
      <path d="M42 28 Q38 20 42 15 Q48 18 46 26" fill="currentColor" opacity="0.3" strokeLinejoin="round"/>
      <path d="M55 25 Q52 18 56 14 Q62 17 60 24" fill="currentColor" opacity="0.3" strokeLinejoin="round"/>
    </svg>
  ),
  stillwater: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M38 15 L38 25 Q32 28 32 35 L32 80 Q32 88 40 88 L60 88 Q68 88 68 80 L68 35 Q68 28 62 25 L62 15 Z"/>
      <path d="M36 18 L64 18"/>
      <path d="M38 50 L62 50" opacity="0.3"/>
      <path d="M38 60 L62 60" opacity="0.3"/>
    </svg>
  ),
  sparkling: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M36 12 L36 28 Q30 30 30 38 L30 82 Q30 88 38 88 L62 88 Q70 88 70 82 L70 38 Q70 30 64 28 L64 12 Z"/>
      <path d="M34 15 L66 15"/>
      <circle cx="42" cy="55" r="1.5" fill="currentColor"/>
      <circle cx="52" cy="48" r="1" fill="currentColor"/>
      <circle cx="58" cy="62" r="1.5" fill="currentColor"/>
      <circle cx="45" cy="68" r="1" fill="currentColor"/>
      <circle cx="55" cy="75" r="1.5" fill="currentColor"/>
    </svg>
  ),
  cookie: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="50" cy="50" r="30"/>
      <circle cx="40" cy="42" r="2.5" fill="currentColor"/>
      <circle cx="58" cy="45" r="2" fill="currentColor"/>
      <circle cx="45" cy="58" r="2.5" fill="currentColor"/>
      <circle cx="62" cy="60" r="2" fill="currentColor"/>
      <circle cx="52" cy="52" r="1.5" fill="currentColor"/>
    </svg>
  ),
  fruit: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <ellipse cx="40" cy="55" rx="18" ry="22"/>
      <ellipse cx="60" cy="50" rx="16" ry="20"/>
      <path d="M48 33 Q52 25 58 30" strokeLinecap="round"/>
      <path d="M55 28 L53 22" strokeLinecap="round"/>
    </svg>
  ),
  dates: () => (
    <svg className="item-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <ellipse cx="35" cy="55" rx="8" ry="14" transform="rotate(-15 35 55)"/>
      <ellipse cx="50" cy="52" rx="8" ry="14"/>
      <ellipse cx="65" cy="55" rx="8" ry="14" transform="rotate(15 65 55)"/>
      <path d="M35 42 L35 38" strokeLinecap="round"/>
      <path d="M50 38 L50 34" strokeLinecap="round"/>
      <path d="M65 42 L65 38" strokeLinecap="round"/>
    </svg>
  )
};
