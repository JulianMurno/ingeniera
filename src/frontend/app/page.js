import './landing.css';
import { landingContent } from './landing-content';
import PublicHeader from '@/components/landing/PublicHeader';
import Hero from '@/components/landing/Hero';
import ValueProps from '@/components/landing/ValueProps';
import RoomShowcase from '@/components/landing/RoomShowcase';
import Amenities from '@/components/landing/Amenities';
import TrustSection from '@/components/landing/TrustSection';
import ContactFooter from '@/components/landing/ContactFooter';

export default function LandingPage() {
  return (
    <div className="landing">
      <a href="#contenido" className="ml-skip-link">
        Saltar al contenido
      </a>
      <PublicHeader content={landingContent} />
      <main id="contenido">
        <Hero content={landingContent} />
        <ValueProps content={landingContent} />
        <RoomShowcase content={landingContent} />
        <Amenities content={landingContent} />
        <TrustSection content={landingContent} />
        <ContactFooter content={landingContent} />
      </main>
    </div>
  );
}
