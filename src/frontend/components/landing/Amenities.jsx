import { iconRegistry } from './icons';

export default function Amenities({ content }) {
  return (
    <section className="ml-section ml-section--values" id="servicios" aria-labelledby="amenities-title">
      <div className="ml-section-inner ml-amenities">
        <div>
          <h2 className="ml-section-title" id="amenities-title">
            {content.amenities.title}
          </h2>
          <p className="ml-section-intro" style={{ marginTop: 22 }}>
            {content.amenities.intro}
          </p>
        </div>

        <div className="ml-amenities-list">
          {content.amenities.items.map((item) => {
            const Icon = iconRegistry[item.icon];
            return (
              <article className="ml-amenity" key={item.name}>
                <Icon className="ml-amenity-icon" />
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
