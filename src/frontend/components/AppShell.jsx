'use client';

import { usePathname } from 'next/navigation';
import Nav from './Nav';

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === '/') {
    return children;
  }

  return (
    <>
      <Nav />
      <main className="container">{children}</main>
    </>
  );
}
