import { ArrowUpRight } from '@phosphor-icons/react';

export function BrandStory({ onSelect }) {
  return <div className="brand-story" id="approach">
    <section className="brand-opening" aria-labelledby="approach-title" data-passage>
      <p className="story-eyebrow">WroughtMind</p>
      <h2 id="approach-title">A thought,<br/>given <em>form.</em></h2>
      <p className="brand-introduction">We make software with a point of view. A place to follow a thought. A way to see how something was made. Ideas you can spend time with.</p>
    </section>
    <div className="brand-principles">
      <section className="brand-principle" aria-labelledby="thread-title" data-passage>
        <h3 id="thread-title">Keep the thread.</h3>
        <div><p>A thought moves from a page to a question to something you write. It should be able to travel, with its sources close by.</p>
          <button className="principle-project" aria-haspopup="dialog" data-project-entry="story-weibei" onClick={event => onSelect('weibei', event)}>Weibei <ArrowUpRight size={15}/></button>
        </div>
      </section>
      <section className="brand-principle" aria-labelledby="hands-title" data-passage>
        <h3 id="hands-title">Show the hands.</h3>
        <div><p>Behind every piece of work are choices, people and tools. Making that process visible is part of making the work. Even the uncertain parts deserve an honest place.</p>
          <button className="principle-project" aria-haspopup="dialog" data-project-entry="story-creditia" onClick={event => onSelect('creditia', event)}>Creditia <ArrowUpRight size={15}/></button>
        </div>
      </section>
      <section className="brand-principle" aria-labelledby="delight-title" data-passage>
        <h3 id="delight-title">Leave room<br/>for delight.</h3>
        <div><p>A little companion falls asleep. A codebase becomes a film credit. Useful things can still have a sense of play.</p></div>
      </section>
    </div>
    <section className="brand-outro" aria-labelledby="open-title" data-passage>
      <h2 id="open-title">Still taking shape.</h2>
      <p>The work, and the decisions behind it, are in the open.</p>
      <a className="principle-project" href="https://github.com/WroughtMind" target="_blank" rel="noreferrer">WroughtMind on GitHub <ArrowUpRight size={16}/></a>
    </section>
  </div>;
}
