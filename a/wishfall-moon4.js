(function(){
function create(o){
 var THREE=window.THREE,canvas=o.canvas;
 var renderer;try{renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});}catch(e){return null;}
 var W=canvas.clientWidth||200,H=canvas.clientHeight||200;
 renderer.setPixelRatio(o.dpr||Math.min(3,Math.max(2,window.devicePixelRatio||1)));renderer.setSize(W,H,false);renderer.setClearColor(0x000000,0);
 var scene=new THREE.Scene();var cam=new THREE.OrthographicCamera(-1,1,1,-1,0,2);
 var tex=new THREE.TextureLoader().load(o.texUrl,function(){draw();snap();if(o.onReady)o.onReady();});tex.wrapS=THREE.RepeatWrapping;tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
 var du=1/(o.texW||2048),dv=1/((o.texW||2048)/2);
 var mat=new THREE.ShaderMaterial({transparent:true,depthTest:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
  uniforms:{uTex:{value:tex},uL:{value:new THREE.Vector3(0,0,1)},uRot:{value:0},uDu:{value:du},uDv:{value:dv}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:'uniform sampler2D uTex;uniform vec3 uL;uniform float uRot;uniform float uDu;uniform float uDv;varying vec2 vUv;'+
  'float hh(vec2 uv){return texture2D(uTex,uv).r;}'+
  'void main(){vec2 p=(vUv-.5)*2.0/0.92;float r2=dot(p,p);float r=sqrt(r2);if(r>1.02){gl_FragColor=vec4(0.);return;}'+
  'float z=sqrt(max(1.-r2,0.0));vec3 n=vec3(p,z);float c=cos(uRot),s=sin(uRot);vec3 b=vec3(c*n.x-s*n.y,s*n.x+c*n.y,n.z);'+
  'vec2 uv2=b.xy*0.5/0.995+0.5;vec3 alc=texture2D(uTex,uv2).rgb;vec3 nn=n;'+
  'float lam=max(dot(nn,uL),0.);float lam0=max(dot(n,uL),0.);float ls=lam/(lam+max(z,0.03))*1.7;ls*=smoothstep(0.0,0.05,lam0+0.02);'+
  'vec3 col=alc*ls*1.0;float alb=dot(alc,vec3(.33));'+
  'col+=alc*vec3(.55,.65,.9)*0.30*(1.-smoothstep(0.,.35,lam0));'+
  'float a=1.-smoothstep(0.985,1.0,r);gl_FragColor=vec4(col*a,a);}'});
 var quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);scene.add(quad);
 function draw(){renderer.render(scene,cam);}
 var st=0;function snap(){if(o.noSnap)return;clearTimeout(st);st=setTimeout(function(){try{canvas.style.backgroundImage='url('+canvas.toDataURL('image/png')+')';canvas.style.backgroundSize='100% 100%';canvas.style.backgroundRepeat='no-repeat';}catch(e){}},200);}
 canvas.addEventListener('webglcontextrestored',function(){setTimeout(function(){draw();snap();},60);});
 return {set:function(L,rot){mat.uniforms.uL.value.set(L[0],L[1],L[2]);mat.uniforms.uRot.value=-rot;draw();snap();},draw:draw,toURL:function(){return canvas.toDataURL('image/png');},dispose:function(){try{renderer.dispose();}catch(e){}}};
}
var cache={};
function thumb(o){
 var cv=document.createElement('canvas');cv.style.cssText='position:fixed;left:-999px;top:0;width:'+(o.size||120)+'px;height:'+(o.size||120)+'px;pointer-events:none';document.body.appendChild(cv);
 var ready=false,cbs=[];
 var r=create({canvas:cv,texUrl:o.texUrl,texW:o.texW,dpr:2,noSnap:true,onReady:function(){ready=true;cbs.splice(0).forEach(function(f){f();});}});
 return {isReady:function(){return ready;},onReady:function(f){if(ready)f();else cbs.push(f);},
  url:function(L,rot){if(!ready||!r)return '';var k=L[0].toFixed(2)+','+L[1].toFixed(2)+','+L[2].toFixed(2)+','+rot.toFixed(2);if(cache[k])return cache[k];r.set(L,rot);return cache[k]=r.toURL();},
  dispose:function(){if(r)r.dispose();if(cv.parentNode)cv.parentNode.removeChild(cv);}};
}
window.WishfallMoon={create:create,thumb:thumb};
})();
