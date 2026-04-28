import { chakra } from '@chakra-ui/react';

const LOGO_MAP: Record<string, string> = {
  openrouter: '/logos/openrouter.svg',
  openai: '/logos/openai.svg',
  'openai-codex': '/logos/openai.svg',
  anthropic: '/logos/anthropic.svg',
  anthropic_token: '/logos/anthropic.svg',
  deepseek: '/logos/deepseek-color.svg',
  huggingface: '/logos/huggingface-color.svg',
  kilocode: '/logos/kilocode.svg',
  minimax: '/logos/minimax-color.svg',
  kimi: '/logos/moonshot.svg',
  nvidia: '/logos/nvidia-color.svg',
  gemini: '/logos/aistudio.svg',
  'google/gemini': '/logos/aistudio.svg',
  opencode_zen: '/logos/opencode.svg',
  opencode_go: '/logos/opencode.svg',
  dashscope: '/logos/qwen-color.svg',
  zai: '/logos/zai.svg',
  'glm/zai': '/logos/zai.svg',
};

function RobotFallback({ size }: { size: number }) {
  const Svg = chakra('svg');
  return (
    <Svg
      viewBox="0 0 24 24"
      width={`${size}px`}
      height={`${size}px`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      color="var(--text-muted)"
      flexShrink={0}
      aria-hidden="true"
    >
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 18h6" />
      <path d="M12 3v3" />
    </Svg>
  );
}

export function ProviderLogo({
  providerId,
  size = 40
}: {
  providerId: string;
  size?: number;
}) {
  const src = LOGO_MAP[providerId];
  if (!src) {
    return <RobotFallback size={size} />;
  }

  const isColorLogo = src.includes('-color');

  return (
    <chakra.img
      src={src}
      alt=""
      width={`${size}px`}
      height={`${size}px`}
      style={{ objectFit: 'contain', flexShrink: 0, display: 'block' }}
      _dark={!isColorLogo ? { filter: 'invert(1)' } : undefined}
    />
  );
}
