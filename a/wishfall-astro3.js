(function(){
var A=window.Astronomy||(typeof Astronomy!=="undefined"?Astronomy:null); var D=Math.PI/180;
var DEF={lat:26.9124,lon:75.7873,name:'Jaipur',real:false};
var SHOWERS=[
 {id:'ori',name:'Orionids',night:[2026,10,21],zhr:20,ra:95,dec:15.6,speed:'Fast',parent:"Halley's Comet",blurb:'Fast, bright streaks. Dust left behind by Halley\'s Comet.'},
 {id:'leo',name:'Leonids',night:[2026,11,17],zhr:15,ra:152,dec:22,speed:'Very fast',parent:'Comet Tempel-Tuttle',blurb:'Very fast streaks, some leave glowing trails.'},
 {id:'gem',name:'Geminids',night:[2026,12,13],zhr:150,ra:112,dec:33,speed:'Medium',parent:'Asteroid Phaethon',blurb:'The best shower of the year. Bright, colourful and plentiful.'},
 {id:'urs',name:'Ursids',night:[2026,12,21],zhr:10,ra:217,dec:76,speed:'Slow',parent:'Comet Tuttle',blurb:'A quiet shower in the far north of the sky.'},
 {id:'qua',name:'Quadrantids',night:[2027,1,3],zhr:80,ra:230,dec:49,speed:'Medium',parent:'Asteroid 2003 EH1',blurb:'Short but intense. Over in a few hours.'}
];
(function(){try{var A=window.Astronomy;if(!A||!A.SearchSunLongitude)return;
var L={qua:283.15,lyr:32.32,eta:45.5,sda:127,per:140.0,dra:195.4,ori:208.0,leo:235.27,gem:262.2,urs:270.7};
[{id:'lyr',name:'Lyrids',night:[2027,4,22],zhr:18,ra:271,dec:34,speed:'Medium',parent:'Comet Thatcher',blurb:'One of the oldest known showers. Mostly steady, with a sudden burst now and then.'},
 {id:'eta',name:'Eta Aquariids',night:[2027,5,5],zhr:50,ra:338,dec:-1,speed:'Very fast',parent:"Halley's Comet",blurb:"Dust from Halley's Comet. Best in the last hour or two before dawn."},
 {id:'sda',name:'Delta Aquariids',night:[2027,7,29],zhr:25,ra:340,dec:-16,speed:'Medium',parent:'Comet 96P/Machholz',blurb:'A gentle summer shower, best after midnight from India.'},
 {id:'per',name:'Perseids',night:[2027,8,12],zhr:100,ra:48,dec:58,speed:'Fast',parent:'Comet Swift-Tuttle',blurb:'The famous August shower. Many bright, fast meteors, some leave glowing trails.'},
 {id:'dra',name:'Draconids',night:[2027,10,8],zhr:10,ra:262,dec:54,speed:'Slow',parent:'Comet Giacobini-Zinner',blurb:'Slow meteors in the early evening. Usually few, now and then a surprise outburst.'}
].forEach(function(s){if(!SHOWERS.some(function(x){return x.id===s.id;}))SHOWERS.push(s);});
var lim=Date.now()-2*86400000,start=new Date(Date.now()-40*86400000);
SHOWERS.forEach(function(s){var lon=L[s.id];if(lon==null)return;try{var t=A.SearchSunLongitude(lon,start,400);if(t&&t.date.getTime()<lim)t=A.SearchSunLongitude(lon,new Date(t.date.getTime()+86400000),400);if(!t)return;var mid=new Date(t.date.getTime()+12*3600000);mid.setHours(0,0,0,0);var d=new Date(mid.getTime()-86400000+3600000);s.night=[d.getFullYear(),d.getMonth()+1,d.getDate()];}catch(e){}});
SHOWERS.sort(function(a,b){return new Date(a.night[0],a.night[1]-1,a.night[2])-new Date(b.night[0],b.night[1]-1,b.night[2]);});
}catch(e){}})();

var DIRS=['north','north-northeast','northeast','east-northeast','east','east-southeast','southeast','south-southeast','south','south-southwest','southwest','west-southwest','west','west-northwest','northwest','north-northwest'];
function dirName(az){return DIRS[Math.round(((az%360)+360)%360/22.5)%16];}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function obsOf(o){return new A.Observer(o.lat,o.lon,0);}
function hz(body,date,o){var ob=obsOf(o);var eq=A.Equator(body,date,ob,true,true);var h=A.Horizon(date,ob,eq.ra,eq.dec,null);return {az:h.azimuth,alt:h.altitude,ra:eq.ra,dec:eq.dec};}
function vec(az,alt){az*=D;alt*=D;return [Math.sin(az)*Math.cos(alt),Math.sin(alt),-Math.cos(az)*Math.cos(alt)];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function norm(a){var l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
function fmtTime(d){if(!d)return '—';var h=d.getHours(),m=d.getMinutes();var ap=h>=12?'pm':'am';h=h%12;if(h===0)h=12;return h+':'+(m<10?'0':'')+m+' '+ap;}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function fmtWhen(d,now){if(!d)return '—';var t=fmtTime(d);if(sameDay(d,now))return t;var tm=new Date(now.getTime()+86400000);if(sameDay(d,tm))return 'Tomorrow '+t;return d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+t;}
function phaseName(deg){var p=((deg%360)+360)%360;
 if(p<6||p>=354)return 'New moon'; if(p<84)return 'Waxing crescent'; if(p<96)return 'First quarter'; if(p<174)return 'Waxing gibbous'; if(p<186)return 'Full moon'; if(p<264)return 'Waning gibbous'; if(p<276)return 'Last quarter'; return 'Waning crescent';}
function moonNote(il){ if(il>=85)return 'Very bright tonight. It hides faint stars and most shooting stars.'; if(il>=55)return 'Bright tonight. Faint stars are washed out.'; if(il>=25)return 'Fairly dim. Good enough for most sky watching.'; if(il>=8)return 'A thin Moon. The sky stays nice and dark.'; return 'Almost no Moon. The darkest, best sky of the month.';}
function nextEv(body,dir,o,date){try{var t=A.SearchRiseSet(body,obsOf(o),dir,date,2);return t?t.date:null;}catch(e){return null;}}
function moonToday(o,date){
 date=date||new Date();
 var m=hz(A.Body.Moon,date,o), s=hz(A.Body.Sun,date,o);
 var ill=A.Illumination(A.Body.Moon,date); var il=Math.round(ill.phase_fraction*100);
 var deg=A.MoonPhase(date);
 var mv=vec(m.az,m.alt), sv=vec(s.az,s.alt);
 var up=[0,1,0]; var upp=norm([up[0]-dot(up,mv)*mv[0],up[1]-dot(up,mv)*mv[1],up[2]-dot(up,mv)*mv[2]]);
 var right=norm(cross(mv,upp));
 var sp=[sv[0]-dot(sv,mv)*mv[0],sv[1]-dot(sv,mv)*mv[1],sv[2]-dot(sv,mv)*mv[2]];
 // light vector in view space: x=right, y=up, z=toward viewer; use true phase so lit fraction is exact
 var ph=ill.phase_angle*D; // 0 = full
 var sl=norm(sp); var sx=dot(sl,right), sy=dot(sl,upp);
 var sn=Math.hypot(sx,sy)||1; var L=[Math.sin(ph)*sx/sn,Math.sin(ph)*sy/sn,Math.cos(ph)];
 var gast=A.SiderealTime(date); var lst=((gast+o.lon/15)%24+24)%24; var H=(lst-m.ra)*15*D; var phi=o.lat*D, dl=m.dec*D;
 var q=Math.atan2(Math.sin(H),Math.tan(phi)*Math.cos(dl)-Math.sin(dl)*Math.cos(H));
 var rise=nextEv(A.Body.Moon,+1,o,date), set=nextEv(A.Body.Moon,-1,o,date);
 var nf=null,nn=null; try{nf=A.SearchMoonPhase(180,date,40).date;nn=A.SearchMoonPhase(0,date,40).date;}catch(e){}
 var nextBig=null; if(nf&&nn){nextBig=nf<nn?{name:'Full moon',date:nf}:{name:'New moon',date:nn};}
 var daysTo=nextBig?Math.max(0,Math.round((nextBig.date-date)/86400000)):null;
 var isUp=m.alt>0;
 return {phase:(il<3?'New moon':(il>97?'Full moon':phaseName(deg))),illum:il,deg:deg,az:m.az,alt:m.alt,dir:dirName(m.az),up:isUp,rise:rise,set:set,riseTxt:fmtWhen(rise,date),setTxt:fmtWhen(set,date),L:L,rot:q,note:moonNote(il),next:nextBig?(nextBig.name+' in '+daysTo+(daysTo===1?' day':' days')):'',sunAlt:s.alt};
}
function greeting(d){var h=d.getHours(); if(h<5)return 'Good night'; if(h<12)return 'Good morning'; if(h<17)return 'Good afternoon'; if(h<21)return 'Good evening'; return 'Good night';}
function dateLine(d){var W=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],M=['January','February','March','April','May','June','July','August','September','October','November','December'];return W[d.getDay()]+', '+d.getDate()+' '+M[d.getMonth()];}
// night samples for a shower: 8pm evening of night[] to 6am next morning, local time, every 30 min
function night(sh,o){
 var n=sh.night; var out=[];
 for(var i=0;i<=20;i++){ // 20:00 -> 06:00
  var d=new Date(n[0],n[1]-1,n[2],20,0,0); d=new Date(d.getTime()+i*1800000);
  var rd=hz(A.Body.Sun,d,o); var mm=hz(A.Body.Moon,d,o);
  var rad=A.Horizon(d,obsOf(o),sh.ra/15,sh.dec,null);
  var ill=A.Illumination(A.Body.Moon,d).phase_fraction;
  var dark=rd.alt<-12;
  var radAlt=rad.altitude;
  var moonUp=mm.alt>2;
  var mf=moonUp?(1-0.8*ill):1;
  var rate=dark&&radAlt>0?sh.zhr*Math.sin(radAlt*D)*mf*0.9:0;
  out.push({d:d,radAlt:radAlt,radAz:rad.azimuth,moonAlt:mm.alt,moonUp:moonUp,ill:ill,rate:rate,dark:dark,sun:rd.alt});
 }
 return out;
}
function verdict(score){return score>=70?'Go':(score>=45?'Maybe':'Skip');}
function evalShower(sh,o,now){
 var ns=night(sh,o); var best=ns[0]; for(var i=1;i<ns.length;i++){if(ns[i].rate>best.rate)best=ns[i];}
 var mf=best.moonUp?(1-best.ill):1;
 var score=Math.round(100*(0.55*Math.min(1,Math.pow(best.rate/45,0.7))+0.45*mf));
 if(best.rate<=0)score=Math.min(score,20);
 var nd=new Date(sh.night[0],sh.night[1]-1,sh.night[2],20,0,0);
 var days=Math.ceil((nd-now)/86400000);
 var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 var nd2=new Date(nd.getTime()+86400000);
 var label='Night of '+nd.getDate()+(nd.getMonth()===nd2.getMonth()?'':' '+M[nd.getMonth()])+'–'+nd2.getDate()+' '+M[nd2.getMonth()];
 var inTxt=days<=0?'Tonight':(days===1?'Tomorrow':'in '+days+' days');
 var moonTxt=best.moonUp?('Moon is up ('+Math.round(best.ill*100)+'% lit)'):'Moon is down by then';
 return {sh:sh,id:sh.id,name:sh.name,score:score,verdict:verdict(score),label:label,inTxt:inTxt,days:days,best:best,bestTime:fmtTime(best.d),facing:cap(dirName(best.radAz)),moonTxt:moonTxt,rate:Math.round(best.rate),nightSamples:ns};
}
function upcoming(o,now){now=now||new Date();var arr=[];for(var i=0;i<SHOWERS.length;i++){var e=evalShower(SHOWERS[i],o,now);if(e.days>=-1)arr.push(e);}return arr;}
function getObserver(cb){
 var o=DEF; try{var s=localStorage.getItem('wf_obs');if(s){var p=JSON.parse(s);if(p&&isFinite(p.lat)&&isFinite(p.lon))o=p;}}catch(e){}
 cb(o); if(o&&o.manual)return;
 try{ var _app=false;try{_app=!!(window.ReactNativeWebView||(window.top&&window.top.ReactNativeWebView));}catch(e){} if(!_app&&navigator.geolocation){ navigator.geolocation.getCurrentPosition(function(p){var n={lat:p.coords.latitude,lon:p.coords.longitude,name:'Your location',real:true};try{localStorage.setItem('wf_obs',JSON.stringify(n));}catch(e){}cb(n);},function(){},{timeout:5000,maximumAge:600000}); } }catch(e){}
}
window.WF={SHOWERS:SHOWERS,moonToday:moonToday,greeting:greeting,dateLine:dateLine,fmtTime:fmtTime,fmtWhen:fmtWhen,dirName:dirName,cap:cap,evalShower:evalShower,upcoming:upcoming,getObserver:getObserver,DEF:DEF,verdict:verdict,setPlace:function(o){try{localStorage.setItem('wf_obs',JSON.stringify(o));}catch(e){}},useGps:function(cb,fail){try{var _t=window.top;if(_t&&_t.ReactNativeWebView){_t.__wfGpsCb=function(n){if(n){cb(n);}else if(fail){fail();}};_t.ReactNativeWebView.postMessage(JSON.stringify({t:'gps'}));setTimeout(function(){if(_t.__wfGpsCb){_t.__wfGpsCb=null;if(fail)fail();}},20000);return;}}catch(e){}try{navigator.geolocation.getCurrentPosition(function(p){var n={lat:p.coords.latitude,lon:p.coords.longitude,name:'Your location',real:true};try{localStorage.setItem('wf_obs',JSON.stringify(n));}catch(e){}cb(n);},function(){if(fail)fail();},{timeout:8000,maximumAge:600000});}catch(e){if(fail)fail();}}};
})();
