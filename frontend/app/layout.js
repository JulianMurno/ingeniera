import Link from 'next/link';
import './globals.css';
import SessionBar from '../components/SessionBar';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Hotel · Extras y servicios',
  description:
    'Gestión de servicios adicionales (room service, lavandería, minibar, parking) y cargos a las reservas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <div className="container topbar-inner">
            <Link href="/reservas" className="brand">
              Hotel Reservas
            </Link>
            <Nav />
            <SessionBar />
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}