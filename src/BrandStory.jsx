import './brand-story.css';

export function BrandStory() {
  return <div className="brand-story" id="approach">
    <section className="brand-philosophy" aria-labelledby="philosophy-title" data-passage>
      <h2 id="philosophy-title">Philosophy</h2>
      <div className="brand-philosophy-body">
        {/* The brand's own philosophy goes here when supplied. */}
      </div>
    </section>
    <section className="brand-contact" aria-labelledby="contact-title" data-passage>
      <h2 id="contact-title">Contact</h2>
      <div className="brand-contact-body">
        {/* The brand's own contact details go here when supplied. */}
      </div>
    </section>
  </div>;
}
