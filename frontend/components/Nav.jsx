'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/reservas', label: 'Reservas' },
  { href: '/catalogo', label: 'Catálogo de extras' },
  { href: '/consumo', label: 'Consumo' },
];

export default function Nav() {
  const pathname = usePathname();
  const active = (href) => (pathname === href || pathname.startsWith(`${href}/`) ? 'active' : '');

  return (
    <nav className="nav">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={`nav-link ${active(l.href)}`}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}