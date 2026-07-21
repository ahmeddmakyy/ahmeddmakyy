/* ────────────────────────────────────────────────────────────────────────────
 * fire.glsl — the ONE shared "anime fire" look. Imported by BOTH:
 *   • AuroraCursor.webgl.ts  → the click-burst pass (#2), drawn as a second
 *     program on the site-wide cursor canvas (no new WebGL context).
 *   • FireFrame.webgl.ts     → the frame-wrap "portal of flame" (#3), a transient
 *     canvas that rings a modal frame while it is open.
 *
 * ART DIRECTION — BLUE ANIME FIRE (ref: "burning-blue-fire-frames-borders").
 * A hard cel-shaded, iridescent flame: deep-indigo INK outline on every tongue →
 * royal blue → azure → cyan body → pale-cyan → white-pink hot core, with a pink
 * kiss under the crest. Self-lit so it reads on light AND dark. Premultiplied
 * output for `blendFunc(ONE, ONE_MINUS_SRC_ALPHA)`.
 *
 * PER-CONTEXT SILHOUETTES — a single `profile` float per burst selects the shape,
 * so a click carries a different flame depending on WHAT was clicked:
 *   0 BLOOM  — anime puff bloom (default, anywhere)
 *   1 RING   — expanding portal ring + centre flash (Videos section)
 *   2 SLASH  — wide, short horizontal streak (top-nav buttons)
 *   3 HEART  — a heart drawn in flame (Let's-talk CTA + Contact section)
 *   4 COLUMN — a tall rising bonfire jet (hero / mid-band marketing CTAs)
 *
 * FRAME FIRE FIXES vs the previous version (user feedback):
 *   • SEAMLESS — the perimeter noise is sampled on a CIRCLE in noise-space
 *     (periodic in the angle) and the flicker frequency is an INTEGER, so there
 *     is no start/end seam anywhere around the ring.
 *   • NO INNER SPILL — the inward reach is ~3px and hard-clipped a couple px
 *     inside the border, so flames never crawl over the video / card content.
 *   • TIGHTER — smaller outer reach (esp. at the bottom) so the ring hugs the
 *     frame and never reaches the caption sitting below it.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Max simultaneous click bursts held in the ring buffer / uniform array. */
export const FIRE_MAX_BURSTS = 16;

/** Burst silhouette selector (mirrors the branch order in fBurst). */
export const FIRE_PROFILE = {
  BLOOM: 0,
  RING: 1,
  SLASH: 2,
  HEART: 3,
  COLUMN: 4,
} as const;
export type FireProfile = (typeof FIRE_PROFILE)[keyof typeof FIRE_PROFILE];

/** JS-side fire tuning (shader-internal constants are documented inline). */
export const FIRE_TUNING = {
  BURST_LIFE: 0.85, //    seconds a single click burst stays alive
  IGNITE_RAMP: 1.0, //    seconds for a frame-wrap to fully ring the frame
  FRAME_R_DEFAULT: 16, // default corner radius (css px) if the frame has none
} as const;

/* Fullscreen triangle from gl_VertexID — no attribute buffer, same as the
 * cursor's liquid program, so every fire program is attribute-free too. */
export const FIRE_VERT = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.,-1.), vec2(3.,-1.), vec2(-1.,3.));
void main(){ gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }
`;

/* value noise + fbm + the BLUE anime ramp + cel banding + SDF helpers + the
 * shared heat→premultiplied-color resolve. */
const FIRE_COMMON = `
const float PI = 3.14159265;

float fHash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float fNoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=fHash(i), b=fHash(i+vec2(1,0)), c=fHash(i+vec2(0,1)), d=fHash(i+vec2(1,1));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fFbm(vec2 p){
  float v=0.0, a=0.55;
  mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){ v+=a*fNoise(p); p=m*p; a*=0.5; }
  return v;
}

// BLUE anime fire ramp: deep-indigo ink -> royal blue -> azure -> cyan ->
// pale-cyan -> white-pink hot -> white core.
vec3 fRamp(float t){
  t=clamp(t,0.0,1.0);
  vec3 c0=vec3(0.05,0.04,0.22);  // deep indigo INK (edge/outline)
  vec3 c1=vec3(0.13,0.22,0.82);  // royal blue
  vec3 c2=vec3(0.16,0.53,1.00);  // azure
  vec3 c3=vec3(0.34,0.90,1.00);  // cyan body
  vec3 c4=vec3(0.72,0.99,1.00);  // pale cyan
  vec3 c5=vec3(1.00,0.92,1.00);  // white-pink hot
  vec3 c6=vec3(1.00,1.00,1.00);  // white core
  vec3 c;
  if(t<0.16)      c=mix(c0,c1,t/0.16);
  else if(t<0.33) c=mix(c1,c2,(t-0.16)/0.17);
  else if(t<0.50) c=mix(c2,c3,(t-0.33)/0.17);
  else if(t<0.68) c=mix(c3,c4,(t-0.50)/0.18);
  else if(t<0.85) c=mix(c4,c5,(t-0.68)/0.17);
  else            c=mix(c5,c6,(t-0.85)/0.15);
  return c;
}

// cel banding: quantize but keep a little softness (manga look)
float fCel(float x){
  float steps=5.0;
  float q=floor(x*steps)/steps;
  return mix(x,q,0.86);
}

float fSdRound(vec2 p, vec2 hw, float r){
  vec2 q=abs(p)-hw+r;
  return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;
}

// a rising teardrop flame (BLOOM / COLUMN share this). lp is already rise-shifted,
// css px, y up. tallDiv squashes the top (bigger = taller/narrower). crownFreq
// sets how many sharp licking tongues carve the crown.
float fTeardrop(vec2 lp, float R, float tallDiv, float seed, float uTime, float crownFreq){
  float nx=lp.x/R;
  float ny=lp.y/R;
  float sy = ny>0.0 ? ny/tallDiv : ny/0.8;
  float dist=length(vec2(nx,sy));
  float env=1.0-smoothstep(0.50,1.10,dist);
  vec2 np=vec2(lp.x*0.020, lp.y*0.016 - uTime*1.7)+seed*13.0;
  float warp=fFbm(np*0.6+seed);
  float n=fFbm(np+warp*1.5);
  float heat=env*(0.75+0.9*(n-0.35));
  float up=smoothstep(0.0,1.5,sy);
  // crown licks pinched into POINTED manga tongues (pow) that reach up and taper
  float cr   = fFbm(vec2(lp.x*crownFreq, lp.y*0.026 - uTime*3.2)+seed*4.0);
  float lick = pow(smoothstep(0.55, 0.86, cr), 1.6);
  float tip  = smoothstep(0.0, 2.2, sy);
  heat += lick*up*tip*(1.0-smoothstep(1.4,3.2,dist))*1.35;
  return max(heat,0.0);
}

// SHARED resolve: heat + smoke + background luminance -> premultiplied fire pixel.
// uOnDark: 0 = over light paper, 1 = over dark ink.
vec4 fireShade(float heat, float smoke, float onDark){
  // A gentle global lift keeps the flame readable without whiting the body out.
  // (The raw field already peaks ~0.9 in the body; big multipliers blow it white.)
  heat=clamp(heat*1.15, 0.0, 1.9);

  // cover is a clean, ANTI-ALIASED silhouette (we no longer cel the alpha, which
  // used to stair-step the edge). temp is the colour position: saturated azure to
  // cyan through the body, white-pink core — and THAT is what gets cel-banded, so
  // the fills read flat/manga while the outline stays razor-sharp.
  float cover = smoothstep(0.10, 0.42, heat);
  float temp  = smoothstep(0.20, 1.55, heat);
  // on LIGHT paper bias cooler/darker so the flame reads as blue strokes on #F5F5F5
  temp = mix(temp*0.74, temp, onDark);
  temp = fCel(temp);

  vec3 col=fRamp(temp);

  // ── anime lineart: a screen-space-CONSTANT ink stroke (fwidth-locked to ~1.6px
  // regardless of how soft the heat gradient is) riding the silhouette, plus a
  // cool iridescent RIM light just inside it. This crisp drawn edge + rim is the
  // single biggest premium-cel lever.
  float aa   = fwidth(cover) + 1e-4;
  float ink  = 1.0 - smoothstep(0.0, 1.6*aa, abs(cover - 0.16));
  float rim  = 1.0 - smoothstep(0.0, 3.0*aa, abs(cover - 0.40));
  col = mix(col, vec3(0.02, 0.03, 0.16), ink*0.92);   // deep-indigo drawn stroke
  // rim shimmer stays inside the blue/pink identity: cyan to periwinkle
  float irid = fNoise(vec2(cover*26.0, uTime*1.7));
  vec3  iri  = mix(vec3(0.45, 0.90, 1.00), vec3(0.78, 0.62, 1.00), irid);
  col += iri * rim * mix(0.20, 0.42, onDark);

  // ── two-tier bloom: a tight white-hot core + a soft cool halo → real depth
  float core = smoothstep(0.80, 1.00, temp);
  float halo = smoothstep(0.52, 0.95, temp);
  col += vec3(0.72, 0.95, 1.00) * pow(core, 2.0) * mix(0.55, 1.00, onDark); // hot core
  col += vec3(0.30, 0.70, 1.00) * pow(halo, 2.6) * mix(0.10, 0.30, onDark); // cool halo
  // pink kiss just under the crest
  col += vec3(0.95, 0.45, 0.90) * smoothstep(0.44, 0.70, temp) * (1.0-core) * 0.20;

  // lift the cyan body so it pops on the void
  col*=mix(1.02, 1.14, onDark);

  // the ink stroke lifts alpha so it reads as an opaque DRAWN line, not a tint
  float alpha = max(cover, ink*0.92);

  // smoke — cool blue-grey wisp (quieter, cooler than the old warm smoke)
  vec3 smokeDark  = vec3(0.05,0.06,0.10);
  vec3 smokeLight = vec3(0.14,0.13,0.17);
  vec3 smokeCol   = mix(smokeLight, smokeDark, onDark);
  float smokeGain = mix(0.26, 0.68, onDark);
  float smokeCap  = mix(0.18, 0.48, onDark);
  float smA=clamp(smoke*smokeGain,0.0,smokeCap)*(1.0-alpha);
  col=mix(col, smokeCol, smA/max(alpha+smA,0.001));
  alpha=clamp(alpha+smA,0.0,1.0);

  return vec4(col*alpha, alpha);
}
`;

/* One click burst → heat contribution, branched by profile. */
const FIRE_BURST_FN = `
float fBurst(vec2 uv, vec4 b, float prof, float uTime, out float smoke){
  smoke=0.0;
  float t=uTime-b.z;
  float life=${FIRE_TUNING.BURST_LIFE.toFixed(2)};
  if(b.z<0.0 || t<0.0 || t>life) return 0.0;
  float age=t/life;                 // 0..1
  float seed=b.w;
  vec2 local=uv-b.xy;               // css px, y up (relative to click)
  // Bursts made much SMALLER (~1-2x the cursor) per request. Scaling the local
  // space up shrinks EVERY profile — teardrop, ring, heart, slash, rise,
  // ignition pop and embers — uniformly, so the silhouettes/meanings are intact.
  local *= 2.8;
  float grow=mix(0.55,1.10,smoothstep(0.0,0.32,age));
  float lenv=smoothstep(0.0,0.05,age)*(1.0-smoothstep(0.60,1.0,age));
  float heat=0.0;

  if(prof < 0.5){
    // ── BLOOM (default) ──
    vec2 lp=local; lp.y-=t*58.0 + t*t*58.0;
    heat=fTeardrop(lp, 56.0*grow, 1.9, seed, uTime, 0.075);
    // discrete flying EMBERS riding the blast front (no loop: 24 angular buckets,
    // ~40% emit, each at its own radius, twinkling) — reads as scattered sparks
    float rr    = length(local);
    float ringR = 22.0 + age*135.0;
    float ea    = atan(local.y, local.x);
    float aidx  = floor((ea + PI) / (2.0*PI) * 24.0);
    float eh    = fHash(vec2(aidx, seed*11.0));
    float er    = ringR * (0.65 + 0.7*eh);
    float on    = step(0.60, fHash(vec2(aidx, 7.0)));
    float ed    = rr - er;
    float tw    = 0.6 + 0.4*sin(uTime*30.0 + aidx);
    heat += on*exp(-ed*ed/(2.0*3.0*3.0))*exp(-age*4.0)*tw*1.3;
    // wisp of smoke, late
    vec2 sp=vec2(local.x*0.013,(local.y-120.0)*0.011-uTime*0.7)+seed*7.0;
    float sm=fFbm(sp+fFbm(sp));
    smoke=max(0.0,sm-0.58)*smoothstep(0.45,0.85,age)*(1.0-smoothstep(0.9,1.0,age))*0.6;

  } else if(prof < 1.5){
    // ── RING / portal (Videos) ── expanding hollow ring + brief centre flash
    vec2 lp=local; lp.y-=t*28.0;
    float d=length(lp);
    float ang=atan(lp.y,lp.x);
    float RR=14.0 + age*100.0;
    float w=18.0*(1.0-0.45*age);
    vec2 nc=vec2(cos(ang),sin(ang))*5.0 + vec2(uTime*0.6,-uTime*0.9) + seed*3.0;
    float n=fFbm(nc+fFbm(nc));
    float band=exp(-pow((d-RR)/w,2.0));
    heat=band*(0.7+1.15*n);
    heat+=smoothstep(0.55,0.95,n)*exp(-abs(d-RR)/(w*2.2))*0.7;      // outward licks
    heat+=exp(-d/28.0)*(1.0-smoothstep(0.0,0.30,age))*0.45;         // brief centre flash

  } else if(prof < 2.5){
    // ── SLASH (top-nav buttons) ── wide short horizontal streak, licking up
    vec2 lp=local; lp.y-=t*26.0;
    float hw=64.0*mix(0.7,1.05,smoothstep(0.0,0.3,age));
    float ex=1.0-smoothstep(0.55,1.05,abs(lp.x)/hw);
    float ny=lp.y/26.0;
    float vy = ny>0.0 ? ny/1.3 : ny/0.7;
    float env=ex*(1.0-smoothstep(0.5,1.1,abs(vy)));
    vec2 np=vec2(local.x*0.030-uTime*0.4, local.y*0.020-uTime*2.2)+seed*7.0;
    float warp=fFbm(np*0.6);
    float n=fFbm(np+warp*1.4);
    heat=env*(0.70+0.95*n);
    float up=smoothstep(0.0,1.2,vy);
    float cr=fFbm(vec2(local.x*0.090, local.y*0.030-uTime*3.0)+seed*5.0);
    heat+=smoothstep(0.50,0.90,cr)*up*ex*1.1;

  } else if(prof < 3.5){
    // ── HEART (Let's-talk CTA + Contact) ── a clean heart-shaped RING of flame.
    // Uses the analytic gradient of the heart implicit to get an EVEN signed
    // distance, so the fire hugs the outline as a crisp ring (not a noisy blob),
    // reaches OUTWARD, stays thin inward, with a soft hollow-warm centre.
    vec2 lp=local; lp.y-=t*38.0 + 8.0;   // gentle rise, sits on the click
    float S=44.0*grow;
    vec2 hp=lp/S;
    float x=hp.x, y=hp.y;
    float A=x*x + y*y - 1.0;
    float hf=A*A*A - x*x*y*y*y;          // <0 inside the heart
    vec2 g=vec2(6.0*x*A*A - 2.0*x*y*y*y, 6.0*y*A*A - 3.0*x*x*y*y);
    float sd=hf/(length(g)+0.001);       // ~signed distance (hp units), <0 inside
    float band = sd>0.0 ? exp(-sd/0.24) : exp(sd/0.09);  // hug boundary, thin inward
    float ang=atan(hp.y, hp.x);
    vec2 nc=vec2(cos(ang),sin(ang))*4.5 + vec2(-uTime*0.5,uTime*0.7) + seed*3.0;
    float n=fFbm(nc+fFbm(nc));
    heat = band*(0.55+1.05*n);
    heat+= smoothstep(0.55,0.95,n)*exp(-max(0.0,sd)/0.5)*0.5;   // outward licking tongues
    heat+= smoothstep(0.0,-0.5,sd)*(0.55+0.45*n)*0.22;          // soft hollow-warm centre

  } else {
    // ── COLUMN (hero / mid-band CTAs) ── tall rising bonfire jet
    vec2 lp=local; lp.y-=t*56.0 + t*t*76.0;
    heat=fTeardrop(lp, 34.0*grow, 3.4, seed, uTime, 0.090);
    vec2 sp=vec2(local.x*0.014,(local.y-150.0)*0.010-uTime*0.8)+seed*7.0;
    float sm=fFbm(sp+fFbm(sp));
    smoke=max(0.0,sm-0.56)*smoothstep(0.45,0.9,age)*(1.0-smoothstep(0.9,1.0,age))*0.55;
  }

  // bright white-hot IGNITION pop at the click point — bypasses lenv (which is
  // zero at birth), so a click always POPS for the first ~120ms before the shape
  // envelope takes over. One central term → every profile gets the ignite.
  float rC     = length(local);
  float ignite = exp(-rC*rC/(2.0*18.0*18.0)) * exp(-age*16.0);
  return max(heat,0.0)*lenv + ignite*2.2;
}
`;

/* Frame-wrap fire → heat contribution ringing a rounded rect (seamless, masked). */
const FIRE_FRAME_FN = `
float fFrameFire(vec2 uv, vec4 card, float cardR, float cardIg, float uTime, out float smoke){
  smoke=0.0;
  vec2 p=uv-card.xy;
  float sd=fSdRound(p, card.zw, cardR);  // <0 inside, >0 outside
  float edge=abs(sd);
  float ang=atan(p.y,p.x);
  float aN=(ang+PI)/(2.0*PI);

  // ignite reveal from the top, spreading both ways (seamless: circular distance)
  float d1=abs(fract(aN-0.75+0.5)-0.5);
  float reveal=smoothstep(cardIg*0.55+0.02, cardIg*0.55-0.06, d1);

  // upward bias: flames on top/sides reach higher; the BOTTOM hugs tight so it
  // never reaches a caption sitting below the frame.
  float up=clamp((p.y+card.w)/(card.w*2.0),0.0,1.0);   // 0 bottom .. 1 top
  float outerReach=mix(11.0, 33.0, up);                 // hug tighter (less spiky)
  float innerReach=3.0;                                 // was 16 → no inward spill

  float prof = sd>0.0 ? exp(-sd/outerReach) : exp(-(-sd)/innerReach);
  prof *= smoothstep(-2.5, 0.5, sd);                    // hard clip: nothing >2px inside
  // a hard OUTSIDE-only mask (kills any interior contribution → no spill on content)
  float outside = smoothstep(-2.0, 2.5, sd);

  // SEAMLESS licking noise: sample on a circle in noise-space (periodic in ang),
  // animated by translating the whole circle over time; radial detail via edge.
  vec2 nc=vec2(cos(ang),sin(ang))*9.0 + vec2(uTime*0.5,-uTime*0.8) + edge*vec2(0.010,0.014) + 3.1;
  float warp=fFbm(nc*0.6);
  float n=fFbm(nc+warp*1.2);

  float heat=prof*(0.5+1.15*n);
  heat*=smoothstep(0.10,0.80, prof*(0.4+n));
  // outward licks — masked to the OUTSIDE so shards never cross into the content
  heat+=smoothstep(0.58,0.95,n)*exp(-max(0.0,sd)/(outerReach*1.25))*outside*0.5;
  heat*=reveal;
  // flicker — INTEGER angular frequency (9) so it stays seamless at the wrap
  heat*=0.90 + 0.14*sin(uTime*2.3 + ang*9.0) + 0.10*n;
  heat=max(heat,0.0);

  // cool smoke drifting up off the TOP edge only (seamless nc-based)
  float topband=smoothstep(0.25,1.0,up)*exp(-max(0.0,sd)/70.0);
  float sm=fFbm(nc*0.5 + vec2(0.0,-uTime*0.4));
  smoke=max(0.0,sm-0.50)*topband*reveal*0.7;

  return heat;
}
`;

/** Fragment shader for the click-burst pass (site-wide cursor canvas). */
export function buildBurstFragment(): string {
  return `#version 300 es
precision highp float;
out vec4 frag;

uniform float uScale;   // css px -> backing px (gl_FragCoord / uScale = css px, y up)
uniform float uTime;
uniform float uOnDark;  // eased background luminance under the pointer
uniform vec4  uBursts[${FIRE_MAX_BURSTS}];     // x,y (css px, y up), startTime, seed
uniform float uBurstProf[${FIRE_MAX_BURSTS}];  // per-burst silhouette selector
${FIRE_COMMON}
${FIRE_BURST_FN}

void main(){
  vec2 uv = gl_FragCoord.xy / uScale;   // css px, y up
  float heat=0.0, smoke=0.0;
  for(int i=0;i<${FIRE_MAX_BURSTS};i++){
    float sm;
    heat += fBurst(uv, uBursts[i], uBurstProf[i], uTime, sm);
    smoke += sm;
  }
  frag = fireShade(heat, smoke, uOnDark);
}
`;
}

/** Fragment shader for the frame-wrap pass (transient modal canvas). */
export function buildFrameFragment(): string {
  return `#version 300 es
precision highp float;
out vec4 frag;

uniform float uScale;   // css px -> backing px
uniform float uTime;
uniform float uOnDark;
uniform vec4  uCard;    // cx,cy (css px, y up), hw, hh
uniform float uCardR;   // corner radius (css px)
uniform float uCardIg;  // ignite progress 0..1
${FIRE_COMMON}
${FIRE_FRAME_FN}

void main(){
  vec2 uv = gl_FragCoord.xy / uScale;   // css px, y up
  float smoke;
  float heat = fFrameFire(uv, uCard, uCardR, uCardIg, uTime, smoke);
  frag = fireShade(heat, smoke, uOnDark);
}
`;
}
