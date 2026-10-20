import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Hotel Reservas — Gestión',
  description: 'Panel de gestión del hotel: reservas, huéspedes, habitaciones y reportes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}