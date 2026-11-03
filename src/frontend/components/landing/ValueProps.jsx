import { iconRegistry } from './icons';

export default function ValueProps({ content }) {
  return (
    <section className="ml-section ml-section--values" id="propuesta" aria-labelledby="values-title">
      <div className="ml-section-inner">
        <div className="ml-section-head">
          <h2 className="ml-section-title" id="values-title">
            {content.values.title}
          </h2>
          <p className="ml-section-intro">{content.values.intro}</p>
        </div>

        <div className="ml-values">
          {content.values.items.map((item) => {
            const Icon = iconRegistry[item.icon];
            return (
              <article className="ml-value" key={item.title}>
                <Icon className="ml-value-icon" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
