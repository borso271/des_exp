(() => {
  'use strict';

  // Calibrated optical model. Keep the GLSL coefficients in their original precision.
const vertex = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  vUv=p; gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;
const fragment = `#version 300 es
precision highp float;
in vec2 vUv;out vec4 fragColor;
uniform vec2 uResolution;
uniform float uAspect,uFrame,uTime;
uniform float uApexX;
uniform float uApexY;
uniform float uZoom;
uniform float uRotation;
uniform float uBeamAngle;
uniform float uFalloffDistance;
uniform float uBeamIntensity;
uniform float uSourceIntensity;
uniform float uTipRadius;
uniform float uEdgeSoftness;
uniform float uLowerDiffusion;
uniform float uAxialSpread;
uniform float uChromaticSpread;
uniform float uHazeStructure;
uniform float uHazeVariation;
uniform vec3 uBeamTint;
uniform float uHaloIntensity;
uniform float uHaloScale;
uniform float uHaloBlue;
uniform float uHaloWarm;
uniform float uHaloViolet;
uniform float uCorona;
uniform float uAmbient;
uniform vec3 uHaloTint;
uniform float uFlareIntensity;
uniform float uFlareSize;
uniform float uFlareX;
uniform float uFlareY;
uniform float uFlareSoftness;
uniform float uFlareRim;
uniform float uWarmGhost;
uniform vec3 uFlareTint;
uniform float uExposure;
uniform float uSaturation;
uniform float uBloom;
uniform float uBloomRadius;
uniform float uBlackLevel;
uniform float uWhiteLevel;
uniform float uGrain;
const float K[7]=float[7](0.0,0.1,0.22,0.4,0.6,0.8,1.03);
const vec3 WIDTH[7]=vec3[7](vec3(0.049671187,0.050705609,0.069201385),vec3(0.082707025,0.083459369,0.090531287),vec3(0.151300098,0.153795,0.173602466),vec3(0.214998395,0.218153525,0.246628089),vec3(0.29028624,0.285274542,0.315891728),vec3(0.323969687,0.340031145,0.379928547),vec3(0.30952089,0.318635223,0.356113563));
const vec3 WS[7]=vec3[7](vec3(0.259853869,0.253497603,0.083671001),vec3(0.471367408,0.475617616,0.472555072),vec3(0.518275768,0.540611523,0.665008446),vec3(0.335448577,0.293744202,0.298388098),vec3(0.316715364,0.357707016,0.392521802),vec3(0.032259344,0.103592033,0.131031565),vec3(-0.110360955,-0.191334637,-0.220830901));
const vec3 AMP[7]=vec3[7](vec3(1.003366409,0.99243536,1.008583755),vec3(0.969056201,0.972984674,0.987282551),vec3(0.919512463,0.928142229,0.954626852),vec3(0.821000132,0.838083025,0.892525778),vec3(0.683421494,0.697795524,0.786112779),vec3(0.491081933,0.481054642,0.560390321),vec3(0.27397394,0.318845689,0.435642638));
const vec3 AS[7]=vec3[7](vec3(-0.332392704,-0.156836017,-0.202643714),vec3(-0.364520829,-0.269848553,-0.233748671),vec3(-0.470998029,-0.445748972,-0.311569201),vec3(-0.597990946,-0.549060729,-0.351137614),vec3(-0.839800188,-0.958542517,-0.91744583),vec3(-0.991581293,-0.972194944,-0.961110934),vec3(-0.92013105,-0.571787008,-0.333016376));
const float POWER[7]=float[7](1.999098896,3.858449914,3.062509216,2.320186283,1.601847223,2.515270948,2.882866747);
const float PS[7]=float[7](24.84202048,6.096489578,-9.596859516,-3.380261845,0.413587029,4.652183705,0.071272057);
const vec3 APEX_SHAPE=vec3(0.002069256,0.95,0.011927637);
const vec4 APEX_GLOW=vec4(0.007328777,-0.005,0.045,0.021370338);
const vec3 APEX_COLOR=vec3(0.212919281,0.197683612,0.211282801);
const vec2 BEAM_OFFSET=vec2(-0.002548347,-0.006220182);
const vec2 BEAM_EDGE=vec2(0.003,0.05);
const vec4 HG0=vec4(-0.00057639,0.061182922,0.487835068,0.513823506);
const vec4 HG1=vec4(0.190190938,0.829041092,0.211918337,0.234468902);
const vec4 HG2=vec4(0.077320011,0.094771231,-0.2,0.0);
const vec3 HC[11]=vec3[11](vec3(0.024496936,0.023387473,0.024976372),vec3(0.0,0.009106428,0.026214103),vec3(0.041089954,0.082303648,0.14163078),vec3(0.0,0.069921031,0.239916207),vec3(0.033004766,0.019185679,0.011016376),vec3(0.115339713,0.053220009,0.022531495),vec3(0.290290802,0.171322975,0.080433703),vec3(0.07424552,0.0,0.094462857),vec3(0.0,0.0,0.0),vec3(0.0,0.052757978,0.049989612),vec3(0.085921528,0.093469751,0.167677121));
const int LOBE_COUNT=9;
const vec4 LOBES[9]=vec4[9](vec4(0.0,0.075,0.1,0.055),vec4(0.0,0.18,0.14,0.075),vec4(0.0,0.3,0.12,0.065),vec4(-0.19,0.3,0.13,0.105),vec4(0.19,0.3,0.13,0.105),vec4(-0.29,0.43,0.07,0.08),vec4(0.29,0.43,0.07,0.08),vec4(0.0,0.47,0.22,0.085),vec4(0.0,0.44,0.085,0.2));
const vec3 LC[9]=vec3[9](vec3(-0.00222126,-0.002109577,-0.00136155),vec3(-0.002315116,0.000250588,0.003658958),vec3(-0.01897149,-0.007419458,0.010254663),vec3(0.014626695,0.010605795,0.006380106),vec3(-0.007085379,-0.010895112,-0.013951901),vec3(0.00880042,0.010573326,0.007916667),vec3(0.017324752,0.019867598,0.020923977),vec3(-0.015355285,-0.01308278,-0.007431779),vec3(0.024756344,0.010690881,-0.011916475));
const vec4 FLARE=vec4(0.004438885,0.450673925,0.091493161,0.95);
const vec3 FC[6]=vec3[6](vec3(0.002487615,0.023494413,0.046885627),vec3(0.087008985,0.11287487,0.087901684),vec3(-0.001747588,-0.004861968,-0.0422355),vec3(-0.010431611,-0.030748221,-0.030238916),vec3(0.062877366,0.021697237,0.010353181),vec3(0.025723681,0.027999024,0.013201843));
float sq(float x){return x*x;}
float logistic(float x){return 1.0/(1.0+exp(clamp(-x,-75.0,75.0)));}
float gauss(vec2 p,vec2 center,vec2 radii){vec2 d=(p-center)/radii;return exp(-dot(d,d));}
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return (noise(p)-.5)*.58+(noise(p*2.03+17.1)-.5)*.28+(noise(p*4.01+9.7)-.5)*.14;}
vec3 decode(vec3 x){return mix(x/12.92,pow(max((x+.055)/1.055,vec3(0)),vec3(2.4)),step(vec3(.04045),x));}
vec3 encode(vec3 x){return mix(x*12.92,1.055*pow(max(x,vec3(0)),vec3(1.0/2.4))-.055,step(vec3(.0031308),x));}
vec3 shoulder(vec3 x){float k=.98;vec3 s=k+(1.0-k)*(1.0-exp(-max(x-k,vec3(0))/(1.0-k)));return mix(x,s,step(vec3(k),x));}

void profiles(float t,out vec3 width,out float power,out vec3 amplitude){
 int i=5;
 for(int j=0;j<6;j++){if(t<K[j+1]){i=j;break;}}
 float span=K[i+1]-K[i];float s=(t-K[i])/span;
 float h00=(2.0*s-3.0)*s*s+1.0;
 float h10=((s-2.0)*s+1.0)*s;
 float h01=(-2.0*s+3.0)*s*s;
 float h11=(s-1.0)*s*s;
 width=max(vec3(.01),h00*WIDTH[i]+h10*span*WS[i]+h01*WIDTH[i+1]+h11*span*WS[i+1]);
 power=clamp(h00*POWER[i]+h10*span*PS[i]+h01*POWER[i+1]+h11*span*PS[i+1],1.0,5.0);
 amplitude=clamp(h00*AMP[i]+h10*span*AS[i]+h01*AMP[i+1]+h11*span*AS[i+1],0.0,1.10);
}

vec3 atmosphere(vec2 q){
 vec2 hp=q/uHaloScale;
 vec2 n=vec2((hp.x-HG0.x)/(HG0.z*max(.35,1.0+HG2.z*hp.y)),(hp.y-HG0.y)/HG0.w);
 float r=max(length(n),.00001);
 float top=sq(clamp(-n.y/r,0.0,1.0));float bottom=sq(clamp(n.y/r,0.0,1.0));
 float blue=exp(-sq((r-1.0)/HG1.x));
 float warm=exp(-sq((r-HG1.y)/HG1.z));
 float magenta=gauss(hp,vec2(-.003,-HG1.w),vec2(HG2.y,HG2.x));
 vec3 arch=blue*(HC[1]+HC[2]*top+HC[3]*bottom)*uHaloBlue;
 arch+=warm*(HC[4]+HC[5]*top+HC[6]*bottom)*uHaloWarm;
 arch+=(HC[7]*magenta+HC[8]*gauss(hp,vec2(0,-.17),vec2(.07,.12)))*uHaloViolet;
 vec3 corona=HC[9]*gauss(q,vec2(0,-.018),vec2(.052,.065))+HC[10]*gauss(q,vec2(0),vec2(.092,.11));
 vec3 ambient=HC[0]*clamp(.70-q.y*.7,0.0,1.0)*uAmbient;
 return ambient+arch*uHaloIntensity*uHaloTint+corona*uCorona;
}

void main(){
 vec2 uv=vec2(vUv.x,1.0-vUv.y);
 // Preserve the reference framing, including its asymmetric screenshot bars.
 float artTop=uFrame>.5?113.0/1331.0:0.0;
 float artHeight=uFrame>.5?1158.0/1331.0:1.0;
 float ay=(uv.y-artTop)/artHeight;
 if(ay<0.0||ay>1.0){fragColor=vec4(0,0,0,1);return;}
 vec2 q=vec2((uv.x-uApexX)*uAspect,ay-uApexY)/uZoom;
 float angle=radians(uRotation);float cs=cos(angle),sn=sin(angle);
 q=mat2(cs,-sn,sn,cs)*q;
 vec3 room=atmosphere(q);
 room+=APEX_COLOR*gauss(q,APEX_GLOW.xy,APEX_GLOW.zw)*uCorona;
 // A rounded hyperbolic cap, not a large Gaussian source blob.
 vec2 bq=q-BEAM_OFFSET;
 float yy=bq.y;
 float t=clamp(yy*(1158.0/600.0)/uFalloffDistance,0.0,1.15);
 vec3 widths,amp;float power;profiles(t,widths,power,amp);
 widths=mix(vec3(widths.r),widths,uChromaticSpread)*uAxialSpread;
 float cap=exp(-sq(max(yy,0.0)/.115));
 float boundary=sqrt(sq(bq.x/tan(radians(uBeamAngle)))+sq(uTipRadius))-uTipRadius+APEX_SHAPE.x*cap;
 float edge=(BEAM_EDGE.x*uEdgeSoftness+BEAM_EDGE.y*t*t*uLowerDiffusion)*(1.0+(APEX_SHAPE.y-1.0)*cap);
 float dist=yy-boundary;
 // Narrow core and low-amplitude wider diffusion, independently of the cross-section.
 float mask=.97*logistic(dist/max(edge,.00025))+.03*logistic(dist/(edge*2.5+.004));
 vec3 profile=exp(-min(vec3(80),pow(abs(vec3(bq.x)/widths),vec3(power))));
 vec3 beam=amp*profile*mask*(1.0+APEX_SHAPE.z*exp(-sq(yy/.19)));
 // Weak, smooth transmission/scattering lobes prevent a sterile radial gradient.
 vec3 shaping=vec3(0);
 for(int i=0;i<LOBE_COUNT;i++){
   shaping+=LC[i]*gauss(q,LOBES[i].xy,LOBES[i].zw)*mask;
 }
 beam=max(beam+shaping*uHazeStructure,vec3(0));
 float texture=fbm(q*18.0+vec2(uTime*.018,0.0))*.010+fbm(q*5.0+21.0)*.013;
 beam*=1.0+texture*uHazeVariation;
 beam*=pow(max(uBeamIntensity,.0001),.454545)*uBeamTint;
 vec3 field=room*(1.0-mask)+beam;

 // Lens ghosts: soft pupil disk, nonuniform lower rim, and a warm axial smear.
 vec2 fc=FLARE.xy+vec2(uFlareX,uFlareY);
 vec2 fp=(q-fc)/(FLARE.z*max(uFlareSize,.05)*vec2(1.0,FLARE.w));
 float rr=length(fp);
 float disk=logistic((1.0-rr)/(.060*uFlareSoftness));
 float lower=clamp(.5+fp.y*.6,0.0,1.0);
 float rim=exp(-sq((rr-.91)/(.095*uFlareSoftness)))*lower;
 float lip=exp(-sq((rr-1.01)/(.05*uFlareSoftness)))*lower;
 vec3 ghost=FC[0]*disk+FC[1]*disk*lower+(FC[2]*rim+FC[3]*lip)*uFlareRim;
 field+=ghost*uFlareIntensity*uFlareTint;
 float radius=FLARE.z*uFlareSize;
 float warm=gauss(q,fc+vec2(0,-radius*.59),vec2(.006,.009));
 float smear=gauss(q,fc+vec2(0,-radius*.73),vec2(.007,.012));
 field+=(FC[4]*warm+FC[5]*smear)*uWarmGhost;

 // Keep the camera development neutral at the reference preset.
 vec3 linear=decode(max(field,vec3(0)));
 float emitter=gauss(bq,vec2(0,.018),vec2(.025,.036))*mask;
 linear+=max(vec3(0),decode(uBeamTint))*(uSourceIntensity-1.0)*emitter;
 vec2 glowQ=bq/max(uBloomRadius,.1);
 float extra=gauss(glowQ,vec2(0),vec2(.019,.021))*.38
            +gauss(glowQ,vec2(0,.015),vec2(.052,.060))*.021
            +gauss(glowQ,vec2(0,.028),vec2(.12,.145))*.0019;
 linear+=vec3(.76,.84,1.0)*extra*uBloom;
 float luminance=dot(linear,vec3(.2126,.7152,.0722));
 linear=mix(vec3(luminance),linear,uSaturation);
 float breathe=1.0+sin(uTime*.38)*.009;
 linear=max(linear,vec3(0))*exp2(uExposure)*breathe;
 vec3 outColor=encode(shoulder(linear));
 outColor=outColor*uWhiteLevel+uBlackLevel/255.0;
 // Sub-LSB dither plus very restrained, luminance-aware grain.
 float grain=(hash(gl_FragCoord.xy+vec2(uTime*7.7,0))-.5)*uGrain/255.0;
 float shadowWeight=.2+.8*smoothstep(.006,.14,max(outColor.r,max(outColor.g,outColor.b)));
 outColor+=grain*shadowWeight;
 fragColor=vec4(clamp(outColor,0.0,1.0),1.0);
}
`;

  window.LightStudyModules.shaders = {vertex, fragment};
})();
