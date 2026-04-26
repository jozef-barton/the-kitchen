import type { TemplateTone } from './types';

export function templateToneStyles(tone: TemplateTone = 'neutral') {
  switch (tone) {
    case 'accent':
      return {
        bg: 'blue.50',
        border: 'blue.200',
        color: 'blue.700',
        darkBg: 'rgba(59, 130, 246, 0.2)',
        darkBorder: 'rgba(96, 165, 250, 0.28)',
        darkColor: 'blue.100'
      };
    case 'success':
      return {
        bg: 'green.50',
        border: 'green.200',
        color: 'green.700',
        darkBg: 'rgba(22, 163, 74, 0.2)',
        darkBorder: 'rgba(74, 222, 128, 0.24)',
        darkColor: 'green.100'
      };
    case 'warning':
      return {
        bg: 'yellow.50',
        border: 'yellow.300',
        color: 'yellow.700',
        darkBg: 'rgba(234, 179, 8, 0.2)',
        darkBorder: 'rgba(250, 204, 21, 0.3)',
        darkColor: 'yellow.200'
      };
    case 'danger':
      return {
        bg: 'red.50',
        border: 'red.200',
        color: 'red.700',
        darkBg: 'rgba(239, 68, 68, 0.18)',
        darkBorder: 'rgba(248, 113, 113, 0.24)',
        darkColor: 'red.100'
      };
    default:
      return {
        bg: 'var(--surface-2)',
        border: 'var(--border-subtle)',
        color: 'var(--text-secondary)',
        darkBg: 'rgba(148, 163, 184, 0.08)',
        darkBorder: 'rgba(148, 163, 184, 0.18)',
        darkColor: 'whiteAlpha.860'
      };
  }
}

export function resolveTemplateGalleryFilterButtonStyles(active: boolean) {
  return {
    bg: active ? 'var(--surface-accent)' : 'var(--surface-2)',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    darkColor: active ? 'whiteAlpha.940' : 'whiteAlpha.860'
  };
}
