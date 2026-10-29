import { useState } from 'react';
import './project-exhibits.css';

const asset = name => `/assets/projects/${name}`;
const webiScenes = [
  { id: 'wake', label: 'Wake', alt: 'Webi wakes up beside Xiaozhu, its little red square companion.' },
  { id: 'read', label: 'Read', alt: 'Webi holds reading, conversation and notes together.' },
  { id: 'play', label: 'Play', alt: 'Webi and Xiaozhu turn around together.' },
];

export function WebiExhibit({ motion = true }) {
  const [scene, setScene] = useState('wake');
  const selected = webiScenes.find(item => item.id === scene);

  return <section className="webi-exhibit" aria-labelledby="webi-exhibit-title">
    <div className="webi-exhibit-copy">
      <h3 id="webi-exhibit-title">Webi &amp; Xiaozhu.</h3>
      <p>Three feet. Two eyes. A little red friend. Usually reading. Occasionally asleep.</p>
      <a className="exhibit-link" href="https://wroughtmind.github.io/weibei/en/webi.html" target="_blank" rel="noopener noreferrer">More of Webi <span aria-hidden="true">↗</span></a>
    </div>
    <div className="webi-theatre">
      <div className="webi-scene" id="webi-scene" role="group" aria-label={`${selected.label}: Webi and Xiaozhu`}>
        <div className="webi-ground" aria-hidden="true" />
        <img key={`${scene}-${motion}`} className="webi-character" src={asset(`webi/${scene}${motion ? '' : '-still'}.webp`)} alt={selected.alt} width="512" height="512" decoding="async" />
      </div>
      <div className="exhibit-selector webi-selector" aria-label="Webi scenes">
        {webiScenes.map(item => <button key={item.id} type="button" aria-pressed={scene === item.id} aria-controls="webi-scene" onClick={() => setScene(item.id)}>{item.label}</button>)}
      </div>
    </div>
  </section>;
}

const creditiaPieces = [
  { id: 'mosaic', label: 'Mosaic', image: 'mosaic-neon.png', alt: 'A neon mosaic maps the surviving files in Weibei to their contributing tools and models.' },
  { id: 'poster', label: 'Film poster', image: 'roll-poster.png', alt: 'A film poster gives Weibei’s human and AI contributors their billing.' },
  { id: 'receipt', label: 'Receipt', image: 'receipt-editorial-folio.png', alt: 'An editorial receipt records the time, commits and lines behind the Weibei example.' },
  { id: 'awards', label: 'Awards', image: 'tier-gala.png', alt: 'An awards-style composition shows the contributors to the Weibei example, with unconfirmed work listed separately.' },
];

export function CreditiaExhibit({ motion = true }) {
  const [piece, setPiece] = useState('mosaic');
  const selected = creditiaPieces.find(item => item.id === piece);

  return <section className="creditia-exhibit" aria-label="Creditia sample exports" data-motion={motion}>
    <figure className="creditia-artwork">
      <div className="creditia-art-stage" id="creditia-art-stage">
        <img key={piece} className={`creditia-piece creditia-piece-${piece}`} src={asset(`creditia/${selected.image}`)} alt={selected.alt} width={piece === 'mosaic' ? '1200' : piece === 'awards' ? '980' : '1080'} height={piece === 'mosaic' ? '860' : piece === 'awards' ? '1282' : '1350'} decoding="async" />
      </div>
      <figcaption>Weibei · sample exports</figcaption>
    </figure>
    <div className="creditia-piece-selector" aria-label="Export designs">
      {creditiaPieces.map(item => <button key={item.id} type="button" aria-pressed={piece === item.id} aria-controls="creditia-art-stage" onClick={() => setPiece(item.id)}>
        <span className="creditia-thumbnail"><img src={asset(`creditia/${item.image}`)} alt="" loading="lazy" /></span>
        <span>{item.label}</span>
      </button>)}
    </div>
  </section>;
}
