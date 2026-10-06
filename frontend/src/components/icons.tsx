/** Minimal inline stroke-icon set — no icon dependency. */

type IconProps = { className?: string };

function base(className?: string) {
  return {
    className: className ?? "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function IconGrid(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconFolder(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2a2 2 0 0 1 1.6.8l1 1.4a2 2 0 0 0 1.6.8H18.5A2.5 2.5 0 0 1 21 10.5v6A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    </svg>
  );
}

export function IconWorkspace(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M7 9.5l2.5 2.5L7 14.5M12.5 14.5H17" />
    </svg>
  );
}

export function IconSpark(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7z" />
      <path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9zM5.5 3l.7 1.6L7.8 5.3l-1.6.7L5.5 7.6l-.7-1.6L3.2 5.3l1.6-.7z" />
    </svg>
  );
}

export function IconLayers(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M4 12.5l8 4.3 8-4.3M4 16.5l8 4.3 8-4.3" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M12 3l7 3v5.5c0 4.2-3 7.5-7 9.5-4-2-7-5.3-7-9.5V6z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

export function IconGift(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
      <path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5M12 8.5v12" />
      <path d="M12 8.5S10.8 4 8.6 4a2.3 2.3 0 0 0 0 4.5zM12 8.5S13.2 4 15.4 4a2.3 2.3 0 0 1 0 4.5z" />
    </svg>
  );
}

export function IconChain(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      <path d="M10.5 7h4a2.5 2.5 0 0 1 2.5 2.5v4M7 10.5v4A2.5 2.5 0 0 0 9.5 17h4" />
    </svg>
  );
}

export function IconBell(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M6 9.5a6 6 0 1 1 12 0c0 3.8 1.2 5 1.8 5.7a.6.6 0 0 1-.45 1H4.65a.6.6 0 0 1-.45-1C4.8 14.5 6 13.3 6 9.5z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function IconAlert(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M12 4.5l8.5 15h-17z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconSend(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M4.5 11.5l15-7-4.8 15-3.1-5.6z" />
      <path d="M11.6 13.9L19.5 4.5" />
    </svg>
  );
}

export function IconFile(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M6.5 3.5h7l4 4v13h-11z" />
      <path d="M13.5 3.5v4h4" />
    </svg>
  );
}

export function IconChevron(p: IconProps) {
  return (
    <svg {...base(p.className)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** Map a nav icon key to its component. */
export const navIcons = {
  grid: IconGrid,
  folder: IconFolder,
  workspace: IconWorkspace,
  spark: IconSpark,
  layers: IconLayers,
  shield: IconShield,
  gift: IconGift,
  chain: IconChain,
} as const;
