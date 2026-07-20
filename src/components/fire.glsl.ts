/* ────────────────────────────────────────────────────────────────────────────
 * fire.glsl — the ONE shared "anime fire" look, ported faithfully from the fire
 * prototype (liquidfire/fire/index.html). It is imported by BOTH:
 *   • AuroraCursor.webgl.ts  → the click-burst pass (#2), drawn as a second
 *     program on the site-wide cursor canvas (no new WebGL context).
 *   • FireFrame.webgl.ts     → the frame-wrap "portal of flame" (#3), a transient
 *     canvas that rings a modal frame while it is open.
 *
 * Sharing happens at the GLSL-source level: the common noise/ramp/cel helpers,
 * the burst() and frameFire() field functions, and the final `fireShade()`
 * heat→premultiplied-color resolve all live here as strings. Each consumer
 * assembles a fragment shader from these chunks + a tiny main(), so the burst
 * and the frame-wrap are pixel-for-pixel the same fire — white-gold hot core →
 * #FD6F00 orange → red-orange / maroon edge, cel-banded, self-lit (reads on
 * light AND dark), premultiplied output for `blendFunc(ONE, ONE_MINUS_SRC_ALPHA)`.
 *
 * ART-DIRECTOR FIXES applied vs the raw prototype:
 *   • BURST CROWN — the round-fireball silhouette is carved by higher-frequency,
 *     upward-biased directional noise into a few sharp licking tongues.
 *   • SMOKE ON LIGHT — `fireShade` is now uOnDark-aware: on light paper the smoke
 *     is warm-tinted (brown, not grey) and its alpha is dropped so it never reads
 *     as a dirty smudge on #F5F5F5.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Max simultaneous click bursts held in the ring buffer / uniform array. */
export const FIRE_MAX_BURSTS = 16;

/** JS-side fire tuning (shader-internal constants are documented in the report). */
export const FIRE_TUNING = {
  BURST_LIFE: 0.9, //     seconds a single click burst stays alive (~0.7–0.9)
  IGNITE_RAMP: 1.1, //    seconds for a frame-wrap to fully ring the frame
  FRAME_R_DEFAULT: 16, // default corner radius (css px) if the frame has none
} as const;

/* Fullscreen triangle from gl_VertexID — no attribute buffer, same as the
 * cursor's liquid program, so every fire program is attribute-free too. */
export const FIRE_VERT = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.,-1.), vec2(3.,-1.), vec2(-1.,3.));
void main(){ gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }
`;

/* value noise + fbm + the anime ramp + cel banding + rounded-rect SDF. */
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

// anime fire ramp: transparent -> maroon -> deep orange -> orange -> soft -> white-gold core
vec3 fRamp(float t){
  t=clamp(t,0.0,1.0);
  vec3 c1=vec3(0.31,0.03,0.03);  // dark ember red
  vec3 c2=vec3(0.51,0.08,0.07);  // maroon 821513
  vec3 c3=vec3(0.89,0.39,0.0);   // E36300
  vec3 c4=vec3(0.99,0.44,0.0);   // FD6F00
  vec3 c5=vec3(0.99,0.71,0.40);  // soft/amber
  vec3 c6=vec3(1.0,0.97,0.86);   // white-gold core
  vec3 c;
  if(t<0.2)       c=mix(c1,c2,t/0.2);
  else if(t<0.4)  c=mix(c2,c3,(t-0.2)/0.2);
  else if(t<0.6)  c=mix(c3,c4,(t-0.4)/0.2);
  else if(t<0.8)  c=mix(c4,c5,(t-0.6)/0.2);
  else            c=mix(c5,c6,(t-0.8)/0.2);
  return c;
}

// cel banding: quantize but keep a little softness (manga look)
float fCel(float x){
  float steps=6.0;
  float q=floor(x*steps)/steps;
  return mix(x,q,0.82);
}

float fSdRound(vec2 p, vec2 hw, float r){
  vec2 q=abs(p)-hw+r;
  return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;
}

// SHARED resolve: heat + smoke + background luminance -> premultiplied fire pixel.
// uOnDark: 0 = over light paper, 1 = over dark ink. Drives the smoke fix.
vec4 fireShade(float heat, float smoke, float onDark){
  heat=clamp(heat,0.0,1.6);
  float shaped=fCel(smoothstep(0.18,1.15,heat));

  float alpha=clamp(shaped*1.25,0.0,1.0);
  vec3 col=fRamp(shaped);
  // extra bloom on the hottest cores (additive white-gold)
  col+=vec3(1.0,0.85,0.55)*pow(smoothstep(0.72,1.0,shaped),2.0)*0.9;

  // smoke — warm-tinted + lower alpha on LIGHT so it never reads as dirty grey
  vec3 smokeDark  = vec3(0.06,0.05,0.05);
  vec3 smokeLight = vec3(0.17,0.09,0.05);          // warm brown
  vec3 smokeCol   = mix(smokeLight, smokeDark, onDark);
  float smokeGain = mix(0.30, 0.80, onDark);        // quieter smoke on paper
  float smokeCap  = mix(0.22, 0.55, onDark);
  float smA=clamp(smoke*smokeGain,0.0,smokeCap)*(1.0-alpha);
  col=mix(col, smokeCol, smA/max(alpha+smA,0.001));
  alpha=clamp(alpha+smA,0.0,1.0);

  return vec4(col*alpha, alpha);
}
`;

/* One click burst → heat contribution (with the sharpened licking-tongue crown). */
const FIRE_BURST_FN = `
float fBurst(vec2 uv, vec4 b, float uTime, out float smoke){
  smoke=0.0;
  float t=uTime-b.z;
  float life=${FIRE_TUNING.BURST_LIFE.toFixed(2)};
  if(b.z<0.0 || t<0.0 || t>life) return 0.0;
  float age=t/life;                 // 0..1
  float seed=b.w;

  vec2 local=uv-b.xy;               // css px, y up (relative to click)
  float rise=t*95.0 + t*t*110.0;    // rise upward over life + slight accel
  local.y-=rise;

  float grow=mix(0.50,1.15,smoothstep(0.0,0.32,age));
  float R=118.0*grow;               // core radius in px

  // teardrop coords: taller than wide, pointy top
  float nx=local.x/R;
  float ny=local.y/R;               // >0 = above click
  float stretchY = ny>0.0 ? ny/2.0 : ny/0.85;
  float dist=length(vec2(nx, stretchY));   // ~1 at silhouette

  float env = 1.0 - smoothstep(0.55, 1.15, dist);   // hard bounded envelope

  // flame-licking noise, domain-warped, scrolling up (body tongues)
  vec2 np=vec2(local.x*0.016, local.y*0.012 - uTime*1.6) + seed*13.0;
  float warp=fFbm(np*0.6 + seed);
  float n=fFbm(np + warp*1.5);        // 0..1, ~0.5 mean

  float heat = env * (0.75 + 0.9*(n-0.35));

  // ── CROWN FIX: carve the silhouette into a few sharp upward tongues ──
  // higher x-frequency = more, thinner tongues; strong upward scroll = licking.
  float upMask = smoothstep(0.0, 1.6, stretchY);      // above the core, tall
  float crownA = fFbm(vec2(local.x*0.060, local.y*0.020 - uTime*3.0) + seed*4.0);
  float crownB = fFbm(vec2(local.x*0.095 + 5.0, local.y*0.030 - uTime*3.6) + seed*9.0);
  float tongues = smoothstep(0.52, 0.90, mix(crownA, crownB, 0.5));
  float lick = tongues * upMask * (1.0 - smoothstep(1.6, 3.2, dist));
  heat += lick * 1.30;
  heat = max(heat,0.0);

  // life envelope: fast attack, long hold, soft fade
  float lenv=smoothstep(0.0,0.05,age)*(1.0-smoothstep(0.60,1.0,age));
  heat*=lenv;

  // spark ring: thin expanding annulus, early only, broken into sparks
  float rr=length(local);
  float ringR=30.0+age*200.0;
  float rw=6.0+age*14.0;
  float ra=(1.0-smoothstep(0.0,0.5,age));
  float sparkN=fNoise(vec2(atan(local.y,local.x)*4.0+seed*20.0, 3.0));
  sparkN=smoothstep(0.35,0.75,sparkN);
  float ring=exp(-pow((rr-ringR)/rw,2.0))*ra*(0.35+0.9*sparkN)*1.2;
  heat+=ring;

  // smoke: small cool wisp drifting just above the flame, late in life only
  vec2 sp=vec2(local.x*0.013, (local.y-150.0)*0.011 - uTime*0.7)+seed*7.0;
  float sm=fFbm(sp+fFbm(sp));
  float smmask=smoothstep(0.3,1.1,(local.y-R*0.6)/(R*1.3))*(1.0-smoothstep(1.4,2.2,dist));
  smoke=max(0.0, sm-0.58)*smmask*smoothstep(0.45,0.85,age)*(1.0-smoothstep(0.9,1.0,age))*0.7;

  return heat;
}
`;

/* Frame-wrap fire → heat contribution ringing a rounded rect. */
const FIRE_FRAME_FN = `
float fFrameFire(vec2 uv, vec4 card, float cardR, float cardIg, float uTime, out float smoke){
  smoke=0.0;
  vec2 p=uv-card.xy;
  float sd=fSdRound(p, card.zw, cardR);  // <0 inside, >0 outside
  float edge=abs(sd);

  float ang=atan(p.y,p.x);
  float aN=(ang+PI)/(2.0*PI);            // 0..1 around
  // reveal starts at top, spreads both ways around the ring
  float startA=0.75;
  float d1=abs(fract(aN-startA+0.5)-0.5);
  float reveal=smoothstep(cardIg*0.55+0.02, cardIg*0.55-0.06, d1);

  // upward bias: flames on top/sides reach higher (fire rises)
  float up=clamp((p.y+card.w)/(card.w*2.0),0.0,1.0); // 0 bottom .. 1 top
  float outerReach=mix(26.0,70.0,up);
  float innerReach=16.0;

  float prof = sd>0.0 ? exp(-sd/outerReach) : exp(-(-sd)/innerReach);

  // licking noise around the perimeter, scrolling up & outward
  vec2 np=vec2(aN*26.0 - uTime*1.1, edge*0.03 - uTime*1.9);
  float warp=fFbm(np*0.6);
  float n=fFbm(np+warp*1.4);

  float heat = prof * (0.55 + 1.15*n);
  heat *= smoothstep(0.12, 0.85, prof*(0.45+n));
  float lick = smoothstep(0.6,0.95,n) * exp(-max(0.0,sd)/(outerReach*1.8));
  heat += lick*0.6;
  heat *= reveal;

  heat *= 0.88 + 0.18*sin(uTime*2.3 + aN*26.0) + 0.12*n;
  heat = max(heat,0.0);

  // smoke drifting up off the top edge only
  float topband=smoothstep(0.2,1.0,up)*exp(-max(0.0,sd)/90.0);
  vec2 sp=vec2(p.x*0.007, (p.y)*0.006-uTime*0.6);
  float sm=fFbm(sp+fFbm(sp));
  smoke=max(0.0,sm-0.55)*topband*reveal*0.8;

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
uniform vec4  uBursts[${FIRE_MAX_BURSTS}]; // x,y (css px, y up), startTime, seed
${FIRE_COMMON}
${FIRE_BURST_FN}

void main(){
  vec2 uv = gl_FragCoord.xy / uScale;   // css px, y up
  float heat=0.0, smoke=0.0;
  for(int i=0;i<${FIRE_MAX_BURSTS};i++){
    float sm;
    heat += fBurst(uv, uBursts[i], uTime, sm);
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
