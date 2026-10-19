
(()=>{
'use strict';
const canvas=document.getElementById('party-webgl');if(!canvas)return;
const scene=document.getElementById('scene-wrap'),btn=document.getElementById('scene-pause'),hint=document.getElementById('scene-hint');
const fallback=()=>{canvas.style.display='none';document.getElementById('scene-fallback').hidden=false;scene.classList.add('fallback-active');btn.hidden=true;hint.textContent='PARTY UNIVERSE · ART DIRECTION';const l=scene.querySelector('.scene-lens-label');if(l)l.innerHTML='<span class="scene-live"></span> 3D ART DIRECTION / COFFEE &amp; CELEBRATION <span class="scene-orbit-mark">✳</span>';};
let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true,depth:true})||canvas.getContext('experimental-webgl');if(!gl)throw Error('WebGL unavailable');}catch(e){fallback();return;}
const vShader=`
attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;
uniform vec3 uT,uS,uR;uniform float uOrbit,uAspect;
varying vec3 vP,vN;varying vec2 vUv;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){vec3 p=rz(ry(rx(aPosition*uS,uR.x),uR.y),uR.z)+uT;
vec3 n=normalize(rz(ry(rx(aNormal/uS,uR.x),uR.y),uR.z));
p=ry(p,uOrbit);n=ry(n,uOrbit);p=rx(p-vec3(0.0,0.18,0.0),0.14);n=rx(n,0.14);
vP=p;vN=n;vUv=aUv;
float depth=12.5-p.z;float f=4.18;
gl_Position=vec4(p.x*f/uAspect,p.y*f,depth-1.6,depth);
}`;
const fShader=`
precision mediump float;
uniform vec3 uColor;uniform float uKind,uTime,uAlpha;uniform sampler2D uLogo;
varying vec3 vP,vN;varying vec2 vUv;
float rnd(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 n=normalize(vN),view=normalize(vec3(0.,1.4,12.)-vP);
vec3 l1=normalize(vec3(-.54,.78,1.05)),l2=normalize(vec3(.88,.42,-.3));
float diffuse=.27+.69*max(dot(n,l1),0.)+.27*max(dot(n,l2),0.);
float spec=pow(max(dot(reflect(-l1,n),view),0.),48.)*1.35+pow(max(dot(reflect(-l2,n),view),0.),25.)*.38;
float fres=pow(1.-max(dot(n,view),0.),3.);
vec3 base=uColor;
if(uKind>1.5 && uKind<2.5){
vec2 g=vUv*vec2(46.,27.),cell=floor(g);vec2 seam=fract(g);
float border=step(.062,seam.x)*step(.062,seam.y)*step(seam.x,.938)*step(seam.y,.938);
float noise=rnd(cell);float wave=sin((cell.x*.28)+(uTime*.6));
base=mix(vec3(.037,.15,.30),vec3(1.,.64,.09),clamp(noise*.78+.45*wave,.0,1.));
base=mix(base,vec3(.07,.12,.23),1.-border);spec*=1.4;
}
if(uKind>2.5 && uKind<3.5){float swirl=sin(11.*length(vUv-vec2(.5)) + atan(vUv.x-.5,vUv.y-.5)*2.5);base=mix(vec3(.27,.071,.018),vec3(.58,.26,.09),.5+.5*swirl);spec*=.55;}
if(uKind>3.5 && uKind<4.5){diffuse=1.75;spec=1.0;base=uColor;}
if(uKind>4.5 && uKind<5.5){spec*=2.15;diffuse+=fres*.5;}
if(uKind>5.5 && uKind<6.5){spec*=2.8;diffuse+=fres*.65;}
vec3 c=base*diffuse+vec3(1.,.78,.51)*spec+vec3(.07,.46,.70)*fres*.36;
if(uKind>.5 && uKind<1.5){vec4 art=texture2D(uLogo,vUv);c=mix(c,art.rgb*.85,art.a*.98);}
if(uKind>3.5 && uKind<4.5){c=base*1.6+vec3(.8,.6,.3)*.1;}
gl_FragColor=vec4(clamp(c,0.,1.),uAlpha);
}`;
function shader(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
let program;
try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vShader));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fShader));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){console.warn('3D scene fallback:',e);fallback();return;}
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
const aPos=gl.getAttribLocation(program,'aPosition'),aNor=gl.getAttribLocation(program,'aNormal'),aUv=gl.getAttribLocation(program,'aUv');
const uniforms={};for(const n of ['uT','uS','uR','uOrbit','uAspect','uColor','uKind','uTime','uAlpha','uLogo']) uniforms[n]=gl.getUniformLocation(program,n);
const meshes=[];
const geo=(p,n,u,indices)=>{const vbo=gl.createBuffer(),ibo=gl.createBuffer();let stride=8,packed=[];for(let i=0;i<p.length/3;i++)packed.push(p[3*i],p[3*i+1],p[3*i+2],n[3*i],n[3*i+1],n[3*i+2],u[2*i],u[2*i+1]);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(packed),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);return{vbo,ibo,count:indices.length};};
function paramSurface(nx,ny,fn){const p=[],n=[],uv=[],idx=[];for(let i=0;i<=ny;i++)for(let j=0;j<=nx;j++){let u=j/nx,v=i/ny,pt=fn(u,v);p.push(...pt.p);n.push(...pt.n);uv.push(u,v);}for(let i=0;i<ny;i++)for(let j=0;j<nx;j++){let k=i*(nx+1)+j;idx.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}return geo(p,n,uv,idx);}
function ball(){return paramSurface(56,36,(u,v)=>{let a=u*Math.PI*2,b=v*Math.PI,nn=[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];return{p:nn,n:nn};});}
function torus(R=.7,r=.16){return paramSurface(64,18,(u,v)=>{let a=2*Math.PI*u,b=2*Math.PI*v;let x=(R+r*Math.cos(b))*Math.cos(a),y=(R+r*Math.cos(b))*Math.sin(a),z=r*Math.sin(b);return{p:[x,y,z],n:[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)]};});}
function lathe(profile){return paramSurface(64,profile.length-1,(u,v)=>{let i=Math.min(profile.length-2,Math.floor(v*(profile.length-1))),t=v*(profile.length-1)-i;let r=profile[i][0]*(1-t)+profile[i+1][0]*t,y=profile[i][1]*(1-t)+profile[i+1][1]*t,dr=profile[i+1][0]-profile[i][0],dy=profile[i+1][1]-profile[i][1];let a=u*2*Math.PI,ca=Math.cos(a),sa=Math.sin(a),m=Math.hypot(dy,dr)||1;return{p:[r*sa,y,r*ca],n:[dy*sa/m,-dr/m,dy*ca/m]};});}
function disk(r=1){let pp=[],nn=[],uv=[],idx=[];pp.push(0,0,0);nn.push(0,1,0);uv.push(.5,.5);for(let j=0;j<=80;j++){let a=j*Math.PI*2/80;pp.push(Math.sin(a)*r,0,Math.cos(a)*r);nn.push(0,1,0);uv.push(.5+.5*Math.sin(a),.5+.5*Math.cos(a));if(j>0)idx.push(0,j,j+1);}return geo(pp,nn,uv,idx);}
function cube(){const p=[],n=[],uv=[],idx=[],faces=[[[1,0,0],[[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1]]],[[-1,0,0],[[-1,-1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1]]],[[0,1,0],[[-1,1,1],[-1,1,-1],[1,1,-1],[1,1,1]]],[[0,-1,0],[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1]]],[[0,0,1],[[-1,-1,1],[-1,1,1],[1,1,1],[1,-1,1]]],[[0,0,-1],[[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,-1]]]];for(let f of faces){let k=p.length/3;for(let i=0;i<4;i++){p.push(...f[1][i]);n.push(...f[0]);uv.push(i===0||i===1?0:1,i===0||i===3?0:1);}idx.push(k,k+1,k+2,k,k+2,k+3);}return geo(p,n,uv,idx);}
function star(){const p=[],n=[],uv=[],idx=[];let pts=[];for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2? .45:1;pts.push([r*Math.cos(a),r*Math.sin(a)]);}for(let side of [-1,1]){let at=p.length/3;p.push(0,0,side*.15);n.push(0,0,side);uv.push(.5,.5);pts.forEach(([x,y])=>{p.push(x,y,side*.15);n.push(0,0,side);uv.push(.5+x*.5,.5+y*.5)});for(let i=0;i<10;i++)if(side===1)idx.push(at,at+1+i,at+1+(i+1)%10);else idx.push(at,at+1+(i+1)%10,at+1+i);}for(let i=0;i<10;i++){let j=(i+1)%10;let k=p.length/3;for(let [id,z] of [[i,-.15],[j,-.15],[j,.15],[i,.15]]){p.push(pts[id][0],pts[id][1],z);n.push(pts[id][0],pts[id][1],0);uv.push(id/10,(z+.15)/.3);}idx.push(k,k+1,k+2,k,k+2,k+3);}return geo(p,n,uv,idx);}
const shapes={sphere:ball(),torus:torus(),thinRing:torus(1,.045),latheCup:lathe([[.5,.35],[.70,.41],[.84,.51],[1.07,1.00],[1.17,1.45],[1.19,1.52],[1.17,1.58],[1.11,1.56],[1.04,1.46],[.98,1.30],[.04,1.28]]),latheBase:lathe([[.1,0],[1.37,.04],[1.62,.09],[1.64,.14],[1.44,.19],[1.15,.21],[.64,.22],[.01,.22]]),latheStand:lathe([[0,0],[2.22,.05],[2.45,.12],[2.4,.25],[2.32,.31],[0,.32]]),disk:disk(),cube:cube(),star:star(),cylinder:lathe([[0,0],[1,0],[1,1],[0,1]])};
const items=[];
function add(shape,color,where,scale=[1,1,1],rot=[0,0,0],kind=0,move=null,alpha=1){let obj={shape:shapes[shape],color,where,scale,rot,kind,move,alpha};items.push(obj);return obj;}
const navy=[.012,.061,.136],gold=[1,.62,.06],gold2=[1,.81,.33],aqua=[.0,.66,.91],cream=[1,.93,.76];
// Stage: metallic rim, gold trim and dramatic midnight-blue podium.
add('cylinder',navy,[0,-1.91,-.42],[2.5,.30,2.08], [0,0,0],5);
add('torus',gold,[0,-1.60,-.42],[2.47,2.03,1],[Math.PI/2,0,0],5);
add('disk',[.07,.17,.30],[0,-1.60,-.42],[2.38,1,1.97], [0,0,0],0);
add('thinRing',aqua,[0,-1.62,-.42],[2.18,1.77,1],[Math.PI/2,0,0],4);
// Coffee saucer + genuine dimensional handle and cup body.
add('latheBase',cream,[.18,-1.59,1.12],[1.03,.92,1.03], [0,0,0],5);
add('torus',gold,[.18,-1.47,1.12],[1.61,1.61,1],[Math.PI/2,0,0],5);
add('latheCup',gold,[.18,-1.65,1.12],[1.12,1.08,1.12],[0,0,0],1);
add('torus',gold2,[1.55,-.63,1.16],[.90,1.1,1.05],[0,0,0],5);
add('torus',cream,[1.57,-.61,1.15],[.63,.78,.76],[0,0,0],0);
add('torus',gold2,[.18,.045,1.12],[1.32,1.32,.75],[Math.PI/2,0,0],5);
add('disk',[.33,.095,.034],[.18,-.252,1.12],[1.11,1,1.11], [0,0,0],3);
// A tiny latte-art heart, rendered as actual geometry hovering over the coffee surface.
function heartMesh(){let p=[0,0,0],n=[0,1,0],uv=[.5,.5],ii=[];const N=72;for(let i=0;i<=N;i++){let a=(i/N)*Math.PI*2;let x=16*Math.pow(Math.sin(a),3)*.032;let z=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*.025;p.push(x,0,z);n.push(0,1,0);uv.push(.5+x,.5+z);}for(let i=1;i<=N;i++)ii.push(0,i,i+1);return geo(p,n,uv,ii);}shapes.heart=heartMesh();add('heart',cream,[.18,-.235,1.12],[.96,1,.96],[0,0,0],0);
// Individually rotating 3D mirrored disco ball; no flattened decorative PNG.
add('sphere',[1,.71,.31],[-1.70,1.60,-1.5],[.82,.82,.82],[0,0,0],2,(t,o)=>{o.rot[1]=t*.43;o.rot[0]=Math.sin(t*.31)*.09;});
add('thinRing',gold,[-1.70,1.60,-1.5],[.98,.98,1],[0,.22,0],5,(t,o)=>o.rot[1]=t*.45);
// Two helium balloons with independently changing surface highlights.
add('sphere',aqua,[2.19,1.66,-1.85],[.70,.85,.57],[0,0,0],5,(t,o)=>{o.where[1]=1.66+Math.sin(t*.86)*.075;o.rot[1]=Math.sin(t*.44)*.18;});
add('sphere',gold2,[2.98,1.15,-2.2],[.47,.65,.47],[0,0,0],5,(t,o)=>{o.where[1]=1.15+Math.sin(t*.73+1.7)*.065;});
// Star balloons: thick extrusions with their own yaw.
add('star',gold2,[-2.65,.30,.2],[.48,.48,.48],[.13,0,-.23],5,(t,o)=>{o.rot[1]=Math.sin(t*.65)*.36;});
add('star',gold,[2.58,.22,.32],[.57,.57,.57],[0,-.4,.19],5,(t,o)=>{o.rot[1]=-.4+Math.sin(t*.62)*.23;});
// Arcade controls: beveled podium illusion, actual cylindrical buttons and joystick.
add('cube',navy,[2.12,-1.08,.65],[.75,.17,.60],[0,-.21,0],5);
add('cube',gold2,[2.12,-.88,.65],[.73,.065,.58],[0,-.21,0],5);
add('cylinder',gold2,[1.87,-.63,.8],[.07,.46,.07],[0,0,0],5);
add('sphere',[.88,.06,.12],[1.87,-.37,.8],[.19,.19,.19],[0,0,0],5,(t,o)=>{o.where[0]=1.87+Math.sin(t*1.3)*.04;});
for(let i=0;i<3;i++){add('sphere',i%2?aqua:gold,[2.2+i*.19,-.74,.9-i*.23],[.12,.055,.12],[0,0,0],4,(t,o)=>{o.scale[1]=.055+Math.max(0,Math.sin(t*2+i*2.1))*.04;});}
// Slim 3D carnival / photo-booth neon arc behind the cup.
add('thinRing',aqua,[1.13,.9,-2.9],[1.55,1.55,1],[0,.17,0],4,(t,o)=>{o.rot[2]=Math.sin(t*.28)*.03;});
add('thinRing',gold,[1.13,.9,-2.9],[1.7,1.7,1],[0,.17,0],5);
// Sculpted coffee beans resting on the saucer.
for(let i=0;i<3;i++)add('sphere',[.25,.085,.035],[-.84+i*.23,-1.38,2.04+i*.08],[.22,.115,.17],[.35,i*.7,.25],0);
// Gold confetti flakes each turn in actual 3D space.
for(let i=0;i<23;i++){let seed=i*18.23,x=Math.sin(seed)*3.05,y=(Math.cos(seed*.31)+1)*1.54-.1,z=-1.1+Math.cos(seed*.89)*1.1;add('cube',i%4===0?aqua:i%3===0?cream:gold,[x,y,z],[.065,.11,.01],[.18,.35,.21],i%4===0?4:5,(t,o)=>{o.rot[0]=t*(.22+i%3*.13);o.rot[1]=t*(.35+i%4*.15);o.where[1]=y+Math.sin(t*.9+i)*.14;});}
// Hand-drawn official-site coffee artwork appears as a second brand cue in the UI.
const logoCanvas=document.createElement('canvas');logoCanvas.width=1024;logoCanvas.height=512;const ctx=logoCanvas.getContext('2d');
function drawBrand(cx){ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#071a36';ctx.font='900 48px Arial';ctx.fillText('ADVERTISING',cx,239);ctx.font='900 53px Arial';ctx.fillText('& MORE',cx,298);ctx.fillStyle='#fff4cc';ctx.font='700 22px Arial';ctx.fillText('GOOD IDEAS. GREAT PARTIES.',cx,335);}
drawBrand(0);drawBrand(1024); // Place mark along UV wrap seam, facing the viewer.
const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,logoCanvas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(uniforms.uLogo,0);
function draw(o,t,orbit,aspect){const g=o.shape;gl.bindBuffer(gl.ARRAY_BUFFER,g.vbo);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.ibo);gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(aNor,3,gl.FLOAT,false,32,12);gl.vertexAttribPointer(aUv,2,gl.FLOAT,false,32,24);gl.enableVertexAttribArray(aPos);gl.enableVertexAttribArray(aNor);gl.enableVertexAttribArray(aUv);
if(o.move)o.move(t,o);gl.uniform3fv(uniforms.uT,o.where);gl.uniform3fv(uniforms.uS,o.scale);gl.uniform3fv(uniforms.uR,o.rot);gl.uniform1f(uniforms.uOrbit,orbit);gl.uniform1f(uniforms.uAspect,aspect);gl.uniform3fv(uniforms.uColor,o.color);gl.uniform1f(uniforms.uKind,o.kind);gl.uniform1f(uniforms.uAlpha,o.alpha);gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_SHORT,0);}
let pause=false,rotOffset=0,targetRot=0,currentRot=0,start=performance.now(),elapsed=0,last=start,interacting=false,lastX=0,frame=0;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
if(reduced){pause=true;btn.setAttribute('aria-pressed','true');btn.innerHTML='▷ <span>PLAY</span>';}
function resize(){let r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.4);let w=Math.min(980,Math.max(1,Math.round(r.width*dpr))),h=Math.min(1080,Math.max(1,Math.round(r.height*dpr)));if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}return w/h;}
function render(now){if(!canvas.isConnected)return;frame=requestAnimationFrame(render);let dt=Math.min(.04,(now-last)/1000);last=now;if(!pause)elapsed+=dt;let asp=resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
let auto=!pause? Math.sin(elapsed*.17)*.12:0;currentRot+=(rotOffset+targetRot+auto-currentRot)*.07;
gl.uniform1f(uniforms.uTime,elapsed);
for(const o of items)draw(o,elapsed,currentRot,asp);
}
try{render(start);}catch(e){cancelAnimationFrame(frame);console.warn('3D draw error:',e);fallback();return;}
btn.addEventListener('click',()=>{pause=!pause;btn.setAttribute('aria-pressed',String(pause));btn.innerHTML=pause?'▷ <span>PLAY</span>':'Ⅱ <span>PAUSE</span>';scene.classList.toggle('motion-paused',pause);});
scene.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;interacting=true;lastX=e.clientX;scene.setPointerCapture?.(e.pointerId);scene.classList.add('dragging');});
scene.addEventListener('pointermove',e=>{const rect=scene.getBoundingClientRect();if(interacting){rotOffset+=(e.clientX-lastX)*.007;lastX=e.clientX;hint.textContent='YOU ARE THE CREATIVE DIRECTOR ✳';}else if(e.pointerType!=='touch'){targetRot=((e.clientX-rect.left)/rect.width-.5)*.20;}});
const endDrag=()=>{interacting=false;scene.classList.remove('dragging');hint.textContent='DRAG TO ROTATE · HOVER TO EXPLORE';};scene.addEventListener('pointerup',endDrag);scene.addEventListener('pointercancel',endDrag);scene.addEventListener('pointerleave',()=>{if(!interacting)targetRot=0;});
scene.addEventListener('dblclick',()=>{rotOffset=0;hint.textContent='RESET TO THE GOOD SIDE ✳';});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);fallback();});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
})();
