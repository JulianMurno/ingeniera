import Link from 'next/link';
import { ArrowRight } from './icons';

export default function Hero({ content }) {
  return (
    <section className="ml-hero" id="inicio" aria-labelledby="hero-title">
      <div className="ml-hero-inner">
        <div className="ml-hero-copy">
          <p className="ml-hero-kicker">
            <span className="ml-kicker-line" aria-hidden="true" />
            {content.hero.kicker}
          </p>
          <h1 className="ml-hero-title" id="hero-title">
            {content.hero.title}
          </h1>
          <p className="ml-hero-lead">{content.hero.lead}</p>
          <div className="ml-hero-actions">
            <Link href={content.actions.book.href} className="ml-btn ml-btn-primary">
              {content.actions.book.label}
              <ArrowRight />
            </Link>
            <Link href={content.actions.guest.href} className="ml-btn ml-btn-ghost">
              {content.actions.guest.label}
            </Link>
          </div>
          <p className="ml-hero-note">{content.hero.note}</p>
        </div>

        <aside className="ml-hero-aside" aria-label="Datos de la ubicación">
          <p className="ml-coordinate">{content.hero.coordinate}</p>
          <p>{content.hero.aside}</p>
          <dl className="ml-hero-facts">
            {content.hero.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
