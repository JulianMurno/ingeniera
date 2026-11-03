import Link from 'next/link';
import { ArrowRight, Mail, MapPin, Phone } from './icons';

export default function ContactFooter({ content }) {
  const { contact, brand, actions } = content;

  return (
    <footer className="ml-footer" id="contacto" aria-labelledby="contact-title">
      <div className="ml-footer-inner">
        <div className="ml-footer-brand">
          <h2 className="ml-footer-name" id="contact-title">
            {contact.title}
          </h2>
          <p>{contact.text}</p>
          <div className="ml-hero-actions">
            <Link href={actions.book.href} className="ml-btn ml-btn-primary">
              {actions.book.label}
              <ArrowRight />
            </Link>
          </div>
        </div>

        <div className="ml-footer-contact">
          <p>
            <MapPin />
            <span>{contact.address}</span>
          </p>
          <a href={contact.phoneHref}>
            <Phone />
            <span>{contact.phone}</span>
          </a>
          <a href={contact.emailHref}>
            <Mail />
            <span>{contact.email}</span>
          </a>
        </div>

        <nav className="ml-footer-links" aria-label="Accesos del sitio">
          {contact.links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-footer-bottom">
        <p>
          {brand.name} · {brand.note}
        </p>
        <p>{contact.legal}</p>
      </div>
    </footer>
  );
}
