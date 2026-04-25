import { useRef } from 'react';
import { Button, chakra } from '@chakra-ui/react';
import { useHermesTheme } from '@hermes-recipes/ui';

function SunIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3.5" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.42 1.42M11.18 11.18l1.42 1.42M3.4 12.6l1.42-1.42M11.18 4.82l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function MoonIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3.5" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a5.5 5.5 0 1 0 8 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ThemeToggle({
  onPersist
}: {
  onPersist: (themeMode: 'dark' | 'light') => Promise<void> | void;
}) {
  const { themeMode, setThemeMode } = useHermesTheme();
  const togglingRef = useRef(false);
  const label = themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      aria-label={label}
      title={label}
      variant="outline"
      borderColor="var(--border-subtle)"
      bg="var(--surface-2)"
      color="var(--text-primary)"
      size="sm"
      rounded="8px"
      minW={0}
      px="2"
      boxShadow="var(--shadow-xs)"
      _hover={{ bg: 'var(--surface-hover)', borderColor: 'var(--border-strong)' }}
      onClick={async () => {
        if (togglingRef.current) return;
        togglingRef.current = true;

        const previousTheme = themeMode;
        const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(nextTheme);

        try {
          await onPersist(nextTheme);
        } catch {
          setThemeMode(previousTheme);
        } finally {
          setTimeout(() => { togglingRef.current = false; }, 300);
        }
      }}
    >
      {themeMode === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
