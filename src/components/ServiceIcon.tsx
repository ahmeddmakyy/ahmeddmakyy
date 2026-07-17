// Flat, two-tone animated service marks — they replace the old 3D "clay" blobs
// (the glossy plastic look read as AI-generated and clashed with the flat system).
// Concepts are drawn from the actual craft:
//   0  an owned position on a field of competitors  (strategy)
//   1  a directed filmstrip, shots lighting up       (AI video)
//   2  a brand voice resolving into copy             (copywriting)
// Each loops a small micro-story via CSS keyframes (see styles.css). All motion
// lives on sub-elements with transform-box:fill-box and NO SVG filters sit over
// moving parts, so every frame composites cheaply — smooth on mobile.

const StrategyIcon = () => (
  <svg className="svc-ic" viewBox="0 0 120 120" role="img" aria-label="One owned position locked on a field of competitors">
    <rect x="20" y="20" width="80" height="80" rx="16" fill="none" stroke="#52483e" strokeWidth="3" />
    <line x1="60" y1="30" x2="60" y2="90" stroke="#453d34" strokeWidth="2" />
    <line x1="30" y1="60" x2="90" y2="60" stroke="#453d34" strokeWidth="2" />
    <circle className="bs-dot" cx="42" cy="44" r="4" fill="#8a8078" />
    <circle className="bs-dot bs-dot2" cx="80" cy="40" r="4" fill="#8a8078" />
    <circle className="bs-dot bs-dot3" cx="44" cy="82" r="4" fill="#8a8078" />
    <circle className="bs-dot bs-dot4" cx="82" cy="82" r="4" fill="#8a8078" />
    <line className="bs-conn" x1="60" y1="60" x2="74" y2="50" stroke="#fd6f00" strokeWidth="3" strokeLinecap="round" />
    <circle className="bs-lock" cx="74" cy="50" r="12" fill="none" stroke="#ff9a45" strokeWidth="3" />
    <circle className="bs-ring" cx="74" cy="50" r="12" fill="none" stroke="#fd6f00" strokeWidth="3" />
    <circle cx="74" cy="50" r="5.5" fill="#fd6f00" />
  </svg>
);

const VideoIcon = () => (
  <svg className="svc-ic" viewBox="0 0 120 120" role="img" aria-label="A filmstrip with the directed shot lighting up frame by frame">
    <rect x="16" y="36" width="88" height="48" rx="8" fill="none" stroke="#efe6da" strokeWidth="3" />
    <g fill="#efe6da">
      <rect x="24" y="39" width="6" height="4" rx="1.5" />
      <rect x="40" y="39" width="6" height="4" rx="1.5" />
      <rect x="56" y="39" width="6" height="4" rx="1.5" />
      <rect x="72" y="39" width="6" height="4" rx="1.5" />
      <rect x="88" y="39" width="6" height="4" rx="1.5" />
      <rect x="24" y="77" width="6" height="4" rx="1.5" />
      <rect x="40" y="77" width="6" height="4" rx="1.5" />
      <rect x="56" y="77" width="6" height="4" rx="1.5" />
      <rect x="72" y="77" width="6" height="4" rx="1.5" />
      <rect x="88" y="77" width="6" height="4" rx="1.5" />
    </g>
    <rect x="26" y="47" width="20" height="26" rx="3" fill="none" stroke="#8a8078" strokeWidth="2.5" />
    <rect x="50" y="47" width="20" height="26" rx="3" fill="none" stroke="#8a8078" strokeWidth="2.5" />
    <rect x="74" y="47" width="20" height="26" rx="3" fill="none" stroke="#8a8078" strokeWidth="2.5" />
    <rect className="av-f" x="26" y="47" width="20" height="26" rx="3" fill="#fd6f00" />
    <rect className="av-f av-f2" x="50" y="47" width="20" height="26" rx="3" fill="#fd6f00" />
    <rect className="av-f av-f3" x="74" y="47" width="20" height="26" rx="3" fill="#fd6f00" />
    <line className="av-head" x1="26" y1="40" x2="26" y2="80" stroke="#ff9a45" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg className="svc-ic" viewBox="0 0 120 120" role="img" aria-label="A brand-voice waveform resolving into lines of copy">
    <g fill="#fd6f00">
      <rect className="cw-bar" x="30" y="34" width="7" height="32" rx="3.5" />
      <rect className="cw-bar cw-b2" x="42" y="26" width="7" height="48" rx="3.5" />
      <rect className="cw-bar cw-b3" x="54" y="38" width="7" height="24" rx="3.5" />
      <rect className="cw-bar cw-b4" x="66" y="22" width="7" height="56" rx="3.5" />
      <rect className="cw-bar cw-b5" x="78" y="34" width="7" height="32" rx="3.5" />
      <rect className="cw-bar cw-b6" x="90" y="40" width="7" height="20" rx="3.5" />
    </g>
    <rect className="cw-line" x="30" y="86" width="42" height="6" rx="3" fill="#efe6da" />
    <rect className="cw-line cw-l2" x="30" y="98" width="58" height="6" rx="3" fill="#8a8078" />
  </svg>
);

const ICONS = [StrategyIcon, VideoIcon, CopyIcon];

export default function ServiceIcon({ index }: { index: number }) {
  const Icon = ICONS[index] ?? ICONS[0];
  return (
    <div className="service-icon" aria-hidden="true">
      <Icon />
    </div>
  );
}
