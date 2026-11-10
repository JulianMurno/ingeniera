export default function TrustSection({ content }) {
  return (
    <section className="ml-trust" id="confianza" aria-labelledby="trust-title">
      <div className="ml-trust-inner">
        <div>
          <h2 className="ml-trust-quote" id="trust-title">
            {content.trust.quote}
          </h2>
          <p className="ml-trust-author">{content.trust.author}</p>
        </div>

        <dl className="ml-trust-facts">
          {content.trust.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
