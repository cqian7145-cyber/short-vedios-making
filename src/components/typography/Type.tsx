import React from 'react';
import {vibeTheme} from '../../themes/vibeTheme';

export type TypeVariant = 'hero' | 'title' | 'year' | 'sectionLabel' | 'body' | 'caption' | 'subtitle' | 'numeric' | 'formula';

const variants: Record<TypeVariant, React.CSSProperties> = {
  hero: {fontFamily: vibeTheme.typography.family.display, fontSize: vibeTheme.typography.size.hero, fontWeight: 400, letterSpacing: vibeTheme.typography.tracking.hero, lineHeight: vibeTheme.typography.lineHeight.tight},
  title: {fontFamily: vibeTheme.typography.family.display, fontSize: vibeTheme.typography.size.title, fontWeight: 400, letterSpacing: vibeTheme.typography.tracking.title, lineHeight: vibeTheme.typography.lineHeight.title},
  year: {fontFamily: vibeTheme.typography.family.display, fontSize: vibeTheme.typography.size.year, fontWeight: 400, letterSpacing: vibeTheme.typography.tracking.year, lineHeight: 0.92, fontVariantNumeric: 'lining-nums tabular-nums'},
  sectionLabel: {fontFamily: vibeTheme.typography.family.body, fontSize: vibeTheme.typography.size.sectionLabel, fontWeight: 400, letterSpacing: vibeTheme.typography.tracking.label, textTransform: 'uppercase', lineHeight: 1.5},
  body: {fontFamily: vibeTheme.typography.family.body, fontSize: vibeTheme.typography.size.body, fontWeight: 400, letterSpacing: vibeTheme.typography.tracking.body, lineHeight: vibeTheme.typography.lineHeight.body},
  caption: {fontFamily: vibeTheme.typography.family.body, fontSize: vibeTheme.typography.size.caption, fontWeight: 400, letterSpacing: vibeTheme.typography.tracking.caption, lineHeight: 1.5},
  subtitle: {fontFamily: vibeTheme.typography.family.body, fontSize: vibeTheme.typography.size.subtitle, fontWeight: 400, letterSpacing: '0.02em', lineHeight: 1.42},
  numeric: {fontFamily: vibeTheme.typography.family.technical, fontSize: vibeTheme.typography.size.numeric, fontWeight: 400, letterSpacing: vibeTheme.typography.tracking.technical, fontVariantNumeric: 'tabular-nums'},
  formula: {fontFamily: vibeTheme.typography.family.display, fontSize: vibeTheme.typography.size.formula, fontWeight: 400, fontStyle: 'italic', letterSpacing: '0.01em'},
};

type TypeProps = {variant: TypeVariant; children: React.ReactNode; color?: string; style?: React.CSSProperties; className?: string};

export const Type: React.FC<TypeProps> = ({variant, children, color = vibeTheme.colors.text.primary, style, className}) => (
  <div className={className} style={{...variants[variant], color, ...style}}>{children}</div>
);

export const YearText: React.FC<Omit<TypeProps, 'variant'>> = (props) => <Type variant="year" {...props} />;
export const SectionLabel: React.FC<Omit<TypeProps, 'variant'>> = (props) => <Type variant="sectionLabel" color={vibeTheme.colors.accent.mutedGold} {...props} />;
export const Caption: React.FC<Omit<TypeProps, 'variant'>> = (props) => <Type variant="caption" color={vibeTheme.colors.text.secondary} {...props} />;
