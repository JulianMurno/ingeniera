const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

function Icon({ children, className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      {children}
    </svg>
  );
}

export function Sun({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </Icon>
  );
}

export function Moon({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z" />
    </Icon>
  );
}

export function Menu({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function Close({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="m5 5 14 14M19 5 5 19" />
    </Icon>
  );
}

export function ArrowRight({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </Icon>
  );
}

export function Bed({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M3 18v-7a2 2 0 0 1 2-2h5v9m0-9h6a2 2 0 0 1 2 2v7M3 15h18M3 18v2m18-2v2" />
      <path d="M7 9V7.5A1.5 1.5 0 0 1 8.5 6h2A1.5 1.5 0 0 1 12 7.5V9" />
    </Icon>
  );
}

export function Pool({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M3 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
      <path d="M6 13V6a2 2 0 0 1 4 0M10 13V6m8 7V6a2 2 0 0 0-4 0m4 0v7" />
    </Icon>
  );
}

export function Spa({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M12 20c0-5 3-8 8-8-1 5-3 8-8 8Zm0 0c0-5-3-8-8-8 1 5 3 8 8 8Z" />
      <path d="M12 20c-2-4-2-8 0-12 2 4 2 8 0 12Z" />
    </Icon>
  );
}

export function Restaurant({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M6 3v7a2 2 0 0 0 4 0V3M8 12v9M16 21v-8m0 0c2 0 3-1.5 3-4V3c-1.5 1-3 3-3 5v5Z" />
    </Icon>
  );
}

export function Wifi({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M3 9a14 14 0 0 1 18 0M6 12.5a9.5 9.5 0 0 1 12 0M9 16a4.5 4.5 0 0 1 6 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function Parking({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </Icon>
  );
}

export function MapPin({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.4" />
    </Icon>
  );
}

export function Phone({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M7.2 3.5 9 8 7.2 9.8a15 15 0 0 0 7 7L16 15l4.5 1.8v3.1c0 .7-.6 1.2-1.3 1.1C10.5 20.2 3.8 13.5 3 4.8c-.1-.7.4-1.3 1.1-1.3h3.1Z" />
    </Icon>
  );
}

export function Mail({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

export function Star({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path
        d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export function Leaf({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="M20 4C12 4 5 7.5 5 14a6 6 0 0 0 6 6c6.5 0 9-7 9-16Z" />
      <path d="M4 21c2.5-6 7-10 13-13" />
    </Icon>
  );
}

export function Check({ className, ...props }) {
  return (
    <Icon className={className} {...props}>
      <path d="m5 12 4 4L19 6" />
    </Icon>
  );
}

export const iconRegistry = {
  sun: Sun,
  moon: Moon,
  menu: Menu,
  close: Close,
  arrow: ArrowRight,
  bed: Bed,
  pool: Pool,
  spa: Spa,
  restaurant: Restaurant,
  wifi: Wifi,
  parking: Parking,
  mapPin: MapPin,
  phone: Phone,
  mail: Mail,
  star: Star,
  leaf: Leaf,
  check: Check,
};
