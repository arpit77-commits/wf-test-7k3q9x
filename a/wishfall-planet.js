/* Wishfall planet viewer: a lit sphere with a real surface map, optional rings.
   create({canvas, tex, ring, ringAlpha, atmo}) -> {set({L,pa,b}), start(), dispose()} */
(function(){
function create(o){
 var THREE=window.THREE,canvas=o.canvas,renderer;
 try{renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,premultipliedAlpha:true});}catch(e){return null;}
 var W=canvas.clientWidth||300,H=canvas.clientHeight||300;
 renderer.setPixelRatio(Math.min(3,Math.max(2,window.devicePixelRatio||1)));renderer.setSize(W,H,false);renderer.setClearColor(0x000000,0);
 var ext=o.ring?2.55:1.28;
 var scene=new THREE.Scene(),cam=new THREE.OrthographicCamera(-ext,ext,ext,-ext,0.1,20);cam.position.set(0,0,6);cam.lookAt(0,0,0);
 var ld=new THREE.TextureLoader();
 var tex=ld.load(o.tex,function(){draw();});tex.wrapS=THREE.RepeatWrapping;tex.anisotropy=4;
 var uni={uTex:{value:tex},uL:{value:new THREE.Vector3(0,0,1)},uAtmo:{value:o.atmo==null?0.25:o.atmo}};
 var mat=new THREE.ShaderMaterial({uniforms:uni,
  vertexShader:'varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform sampler2D uTex;uniform vec3 uL;uniform float uAtmo;varying vec2 vUv;varying vec3 vN;'+
  'void main(){vec3 n=normalize(vN);vec3 c=texture2D(uTex,vUv).rgb;float lam=dot(n,normalize(uL));float day=smoothstep(-0.06,0.16,lam);float sh=max(lam,0.0);'+
  'float limb=0.5+0.5*max(n.z,0.0);vec3 col=c*(0.035+1.1*pow(sh,0.8))*limb;col=mix(c*0.03,col,day);'+
  'float rim=pow(1.-max(n.z,0.0),3.0)*uAtmo*day;col+=vec3(.55,.65,.9)*rim*0.5;gl_FragColor=vec4(col,1.);}'});
 var roll=new THREE.Group(),tilt=new THREE.Group(),spin=new THREE.Group();scene.add(roll);roll.add(tilt);tilt.add(spin);
 var sph=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),mat);spin.add(sph);
 var ringMesh=null;
 if(o.ring){var rc=ld.load(o.ring,function(){draw();}),ra=ld.load(o.ringAlpha,function(){draw();});
  var rm=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{uC:{value:rc},uA:{value:ra},uL:uni.uL,uIn:{value:1.24},uOut:{value:2.27}},
   vertexShader:'varying vec3 vP;varying vec3 vW;void main(){vP=position;vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform sampler2D uC;uniform sampler2D uA;uniform vec3 uL;uniform float uIn;uniform float uOut;varying vec3 vP;varying vec3 vW;'+
   'void main(){float r=length(vP.xy);float u=(r-uIn)/(uOut-uIn);if(u<0.||u>1.)discard;vec3 c=texture2D(uC,vec2(u,.5)).rgb;float a=texture2D(uA,vec2(u,.5)).r;'+
   '/* planet shadow on the rings: ray from the point toward the Sun hits the sphere? */ vec3 L=normalize(uL);float b=dot(vW,L);float disc=b*b-(dot(vW,vW)-1.);float sh=1.;if(disc>0.&&b<0.){sh=0.28;}'+
   'gl_FragColor=vec4(c*1.05*sh,a*0.96);}'});
  ringMesh=new THREE.Mesh(new THREE.PlaneGeometry(2*2.27,2*2.27,1,1),rm);ringMesh.rotation.x=-Math.PI/2;ringMesh.renderOrder=2;tilt.add(ringMesh);}
 var running=false,t0=performance.now(),spinRate=o.spin||0.06;
 function draw(){renderer.render(scene,cam);}
 function frame(now){if(!running)return;if(!canvas.isConnected){running=false;return;}requestAnimationFrame(frame);spin.rotation.y=((now-t0)/1000)*spinRate;draw();}
 return {
  set:function(p){if(p.L)uni.uL.value.set(p.L[0],p.L[1],p.L[2]);if(p.pa!=null)roll.rotation.z=p.pa;if(p.b!=null)tilt.rotation.x=p.b;draw();},
  start:function(){if(running)return;running=true;requestAnimationFrame(frame);},
  stop:function(){running=false;},
  dispose:function(){running=false;try{renderer.dispose();}catch(e){}}
 };
}
window.WishfallPlanet={create:create};
})();
