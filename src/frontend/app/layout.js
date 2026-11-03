import './globals.css';
import AppShell from '../components/AppShell';

const themeScript = `
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('mirador-theme');
  } catch (error) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  document.documentElement.setAttribute('data-landing-theme', theme);
})();
`;

export const metadata = {
  title: 'Mirador del Sol',
  description:
    'Hotel de sierra en el Valle de Calamuchita: habitaciones con vista, desayuno de campo y descanso entre sierras.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
