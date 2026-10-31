/* Oyaji-jikiden Aburasoba site motion. ASCII only (all copy lives in the HTML). */
(function(){
"use strict";
var RM=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var HAS_G=!!window.gsap;
var mobile=window.matchMedia("(max-width:960px)").matches;
if(HAS_G&&window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);

/* ---------- smooth scroll ---------- */
var lenis=null;
if(!RM&&HAS_G&&window.Lenis){
  lenis=new Lenis({lerp:0.085,smoothWheel:true});
  lenis.on("scroll",ScrollTrigger.update);
  gsap.ticker.add(function(t){lenis.raf(t*1000);});
  gsap.ticker.lagSmoothing(0);
}

/* ---------- split text into chars ---------- */
function split(el){
  if(el._split)return el._split;
  var out=[];
  (function walk(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(n){
      if(n.nodeType===3){
        var frag=document.createDocumentFragment();
        var last=null;
        Array.from(n.textContent).forEach(function(c){
          if(/\s/.test(c)){frag.appendChild(document.createTextNode(c));last=null;return;}
          /* punctuation sticks to the previous char so it never starts a line alone */
          if(last&&/[\u3001\u3002\uFF0C\uFF0E\uFF01\uFF1F\u300D\u300F\uFF09!?]/.test(c)){last.textContent+=c;return;}
          var s=document.createElement("span");s.className="ch";s.textContent=c;frag.appendChild(s);out.push(s);last=s;
        });
        node.replaceChild(frag,n);
      }else if(n.nodeType===1&&n.tagName!=="BR"&&!n.classList.contains("nosplit")){walk(n);}
    });
  })(el);
  el._split=out;return out;
}

/* ---------- header ---------- */
var hd=$(".hd"),lastY=0;
function onScrollHd(y){
  if(!hd)return;
  hd.classList.toggle("solid",y>60);
  if(!document.body.classList.contains("menu-open"))hd.classList.toggle("hide",y>lastY&&y>200);
  lastY=y;
}
if(lenis)lenis.on("scroll",function(e){onScrollHd(e.scroll);});else window.addEventListener("scroll",function(){onScrollHd(window.scrollY);},{passive:true});

/* ---------- mobile menu ---------- */
var bg=$(".burger");
if(bg)bg.addEventListener("click",function(){
  var open=document.body.classList.toggle("menu-open");bg.setAttribute("aria-expanded",open);
  if(lenis){open?lenis.stop():lenis.start();}
  if(open&&HAS_G)gsap.fromTo($$(".mnav a"),{yPercent:120,opacity:0},{yPercent:0,opacity:1,stagger:.08,duration:.8,ease:"expo.out",delay:.25});
});

/* ---------- cursor ---------- */
var cur=$(".cur");
if(cur&&!RM&&window.matchMedia("(hover:hover) and (pointer:fine)").matches){
  var cx=innerWidth/2,cy=innerHeight/2,tx=cx,ty=cy,em=$("em",cur);
  window.addEventListener("mousemove",function(e){tx=e.clientX;ty=e.clientY;});
  (function loop(){cx+=(tx-cx)*.2;cy+=(ty-cy)*.2;cur.style.transform="translate("+cx+"px,"+cy+"px)";requestAnimationFrame(loop);})();
  document.addEventListener("mouseover",function(e){
    var lab=e.target.closest("[data-cursor]"),lk=e.target.closest("a,button");
    cur.classList.toggle("lab",!!lab);cur.classList.toggle("big",!lab&&!!lk);
    if(lab&&em)em.textContent=lab.getAttribute("data-cursor");
  });
}

/* ---------- magnetic buttons ---------- */
if(!RM&&!mobile)$$(".btn,.seal,.burger").forEach(function(b){
  b.addEventListener("mousemove",function(e){var r=b.getBoundingClientRect();var x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;b.style.transform="translate("+x*.18+"px,"+y*.25+"px)";});
  b.addEventListener("mouseleave",function(){b.style.transform="";});
});

/* ---------- page transition ---------- */
var wipe=$(".wipe");
function wipeIn(cb){
  if(!HAS_G||RM||!wipe){cb();return;}
  wipe.style.pointerEvents="auto";
  gsap.fromTo($$("i",wipe),{scaleY:0,transformOrigin:"bottom"},{scaleY:1,duration:.55,stagger:.07,ease:"expo.inOut",onComplete:cb});
}
function wipeOut(){
  if(!HAS_G||!wipe)return;
  gsap.set($$("i",wipe),{scaleY:1,transformOrigin:"top"});
  gsap.to($$("i",wipe),{scaleY:0,duration:.75,stagger:.07,ease:"expo.inOut",delay:.05,onComplete:function(){wipe.style.pointerEvents="none";}});
}
$$("a[href]").forEach(function(a){
  var h=a.getAttribute("href");
  if(!h||h.charAt(0)==="#"||/^(https?:|mailto:|tel:)/.test(h)||a.target==="_blank")return;
  a.addEventListener("click",function(e){
    if(e.metaKey||e.ctrlKey||e.shiftKey)return;
    e.preventDefault();document.body.classList.remove("menu-open");
    try{sessionStorage.setItem("abura-wipe","1");}catch(x){}
    wipeIn(function(){location.href=h;});
  });
});

/* ---------- loader (first visit of the session) ---------- */
function runLoader(done){
  var ld=$(".loader");var seen=false;
  try{seen=sessionStorage.getItem("abura-loaded")==="1";}catch(x){}
  if(!ld){done();return;}
  if(seen||RM||!HAS_G){ld.remove();done();return;}
  try{sessionStorage.setItem("abura-loaded","1");}catch(x){}
  var pct=$(".pct",ld),fill=$(".k i",ld),o={v:0};
  var tl=gsap.timeline({onComplete:function(){ld.remove();}});
  tl.to(o,{v:100,duration:1.6,ease:"power2.inOut",onUpdate:function(){pct.textContent=Math.round(o.v);fill.style.clipPath="inset("+(100-o.v)+"% 0 0 0)";}})
    .to($(".k",ld),{scale:1.15,duration:.5,ease:"power2.in"},"-=.2")
    .to(ld,{clipPath:"inset(0 0 100% 0)",duration:.9,ease:"expo.inOut"},"-=.1")
    .add(done,"-=.6");
}

/* ---------- generic reveals ---------- */
function reveals(){
  if(!HAS_G||RM){$$("[data-split]").forEach(function(el){split(el);});return;}
  $$("[data-split]").forEach(function(el){
    if(el.hasAttribute("data-manual"))return;
    var ch=split(el);
    gsap.fromTo(ch,{yPercent:110,opacity:0,rotate:8},{yPercent:0,opacity:1,rotate:0,duration:1,ease:"expo.out",stagger:{each:.025,from:"start"},scrollTrigger:{trigger:el,start:"top 85%"}});
  });
  $$("[data-reveal]").forEach(function(el){
    var k=el.getAttribute("data-reveal");
    if(k==="mask")gsap.fromTo(el,{clipPath:"inset(100% 0 0 0)"},{clipPath:"inset(0% 0 0 0)",duration:1.4,ease:"expo.inOut",scrollTrigger:{trigger:el,start:"top 85%"}});
    else if(k==="side")gsap.fromTo(el,{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)",duration:1.4,ease:"expo.inOut",scrollTrigger:{trigger:el,start:"top 85%"}});
    else gsap.fromTo(el,{y:60,opacity:0},{y:0,opacity:1,duration:1.2,ease:"expo.out",scrollTrigger:{trigger:el,start:"top 88%"}});
  });
  $$("[data-parallax]").forEach(function(el){
    var v=parseFloat(el.getAttribute("data-parallax"))||15;
    gsap.fromTo(el,{yPercent:-v},{yPercent:v,ease:"none",scrollTrigger:{trigger:el.parentElement,start:"top bottom",end:"bottom top",scrub:true}});
  });
}

/* ---------- marquees with scroll velocity ---------- */
function marquees(){
  $$(".mq").forEach(function(m){
    var html=m.innerHTML;m.innerHTML=html+html+html+html;
    if(!HAS_G||RM)return;
    var dir=m.hasAttribute("data-rev")?1:-1,x=0,speed=0.6,w=0;
    function measure(){w=m.scrollWidth/4;}measure();window.addEventListener("resize",measure);
    gsap.ticker.add(function(){
      var v=lenis?lenis.velocity:0;
      x+=dir*(speed+Math.min(Math.abs(v),40)*0.25);
      if(x<-w)x+=w;if(x>0)x-=w;
      gsap.set(m,{x:x,skewX:gsap.utils.clamp(-8,8,-v*0.25)});
    });
  });
}

/* ---------- odometer ---------- */
function odometers(){
  $$(".odo[data-value]").forEach(function(o){
    var val=o.getAttribute("data-value"),unit=o.getAttribute("data-unit")||"";
    o.innerHTML="";
    var cols=[];
    Array.from(val).forEach(function(c){
      if(/\d/.test(c)){var col=document.createElement("span");col.className="col";var inner=document.createElement("span");
        for(var r=0;r<3;r++)for(var i=0;i<10;i++){var s=document.createElement("span");s.textContent=i;inner.appendChild(s);}
        col.appendChild(inner);o.appendChild(col);cols.push([inner,+c]);}
      else{var s2=document.createElement("span");s2.textContent=c;o.appendChild(s2);}
    });
    if(unit){var u=document.createElement("span");u.className="u";u.textContent=unit;o.appendChild(u);}
    cols.forEach(function(p,i){
      var target=(20+p[1]);
      if(!HAS_G||RM){p[0].style.transform="translateY("+(-target*1.15)+"em)";return;}
      gsap.fromTo(p[0],{y:0},{y:(-target*1.15)+"em",duration:2.2+i*.25,ease:"expo.out",scrollTrigger:{trigger:o,start:"top 92%"}});
    });
  });
}

/* ---------- hero ---------- */
function hero(){
  var h=$(".hero");if(!h)return;
  var ttl=$(".ttl",h),ch=split(ttl),ph=$(".ph img",h);
  if(HAS_G&&!RM){
    var tl=gsap.timeline();
    gsap.set(ph,{transformOrigin:"50% 62%"});
    tl.fromTo(ph,{scale:1.35,filter:"brightness(.2)"},{scale:1.04,filter:"brightness(1)",duration:2.4,ease:"expo.out"})
      .to(ph,{scale:mobile?1.14:1.34,duration:18,ease:"sine.inOut"},2.4)
      .fromTo(ch,{yPercent:120,rotate:10,opacity:0},{yPercent:0,rotate:0,opacity:1,duration:1.4,ease:"expo.out",stagger:.12},.2)
      .fromTo(".hero .vt",{opacity:0,y:-40},{opacity:1,y:0,duration:1.2,ease:"expo.out"},.6)
      .fromTo(".hero .stamp",{scale:0,rotate:-90},{scale:1,rotate:0,duration:1.2,ease:"back.out(2)"},.9)
      .fromTo(".hero .bot>*",{y:40,opacity:0},{y:0,opacity:1,duration:1,ease:"expo.out",stagger:.12},1);
    gsap.to(".hero .ph",{yPercent:12,ease:"none",scrollTrigger:{trigger:h,start:"top top",end:"bottom top",scrub:true}});
    gsap.to(ttl,{yPercent:-40,opacity:.15,ease:"none",scrollTrigger:{trigger:h,start:"top top",end:"bottom top",scrub:true}});
    if(!mobile)h.addEventListener("mousemove",function(e){var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;gsap.to(".hero .ph",{x:-x*30,y:-y*20,duration:1.2,ease:"power3.out"});gsap.to(ttl,{x:x*24,duration:1.2,ease:"power3.out"});});
  }
  steam($("canvas",h),h);
}
function steam(cv,host){
  if(!cv||RM)return;
  var c=cv.getContext("2d"),W,H,P=[],dpr=Math.min(2,window.devicePixelRatio||1),vis=true;
  function rs(){W=cv.width=host.clientWidth*dpr;H=cv.height=host.clientHeight*dpr;}rs();window.addEventListener("resize",rs);
  var N=mobile?46:72;
  function make(init){var wide=W*(mobile?.5:.3);return {x:W*.5+(Math.random()-.5)*wide,y:init?H*(.15+Math.random()*.5):H*(.5+Math.random()*.14),r:(40+Math.random()*100)*dpr,vy:(.5+Math.random()*.9)*dpr,ph:Math.random()*6.28,sw:.6+Math.random()*1.4,a:0,life:0,max:220+Math.random()*220,pk:.11+Math.random()*.1};}
  for(var i=0;i<N;i++)P.push(make(true));
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(host);
  (function tick(){
    requestAnimationFrame(tick);if(!vis)return;
    c.clearRect(0,0,W,H);c.globalCompositeOperation="source-over";
    P.forEach(function(p,i){
      p.life++;p.y-=p.vy;p.ph+=.014;p.x+=Math.sin(p.ph)*p.sw*dpr;p.r+=.35*dpr;
      var t=p.life/p.max;p.a=Math.sin(Math.min(1,t)*Math.PI)*p.pk;
      var g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);g.addColorStop(0,"rgba(255,248,236,"+p.a+")");g.addColorStop(1,"rgba(255,248,236,0)");
      c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();
      if(t>=1)P[i]=make(false);
    });
  })();
}

/* ---------- onko (cream statement) ---------- */
function onko(){
  var s=$(".onko");if(!s||!HAS_G||RM){if(s)$$("[data-split]",s).forEach(split);return;}
  var big=split($(".onko .big .w")),vt=split($(".onko .vtext"));
  gsap.fromTo(big,{opacity:0,scale:1.6,filter:"blur(10px)"},{opacity:1,scale:1,filter:"blur(0px)",stagger:.18,duration:1.2,ease:"expo.out",scrollTrigger:{trigger:s,start:"top 70%"}});
  gsap.fromTo(vt,{opacity:.08},{opacity:1,stagger:.04,ease:"none",scrollTrigger:{trigger:".onko .vtext",start:"top 75%",end:"bottom 55%",scrub:true}});
  gsap.fromTo(".onko .ill",{y:120,rotate:-6,opacity:0},{y:0,rotate:0,opacity:1,duration:1.6,ease:"expo.out",scrollTrigger:{trigger:".onko .ill",start:"top 85%"}});
  gsap.to(".onko .seal2",{rotate:350,ease:"none",scrollTrigger:{trigger:s,start:"top bottom",end:"bottom top",scrub:true}});
}

/* ---------- mix: 8 times ---------- */
function mix(){
  var s=$(".mix");if(!s)return;
  var cv=$("canvas",s),c=cv.getContext("2d"),dpr=Math.min(2,window.devicePixelRatio||1),S;
  var nEl=$(".count .n",s),say=$(".say",s),ticks=$$(".ticks i",s),naruto=new Image();naruto.src=s.getAttribute("data-naruto");
  var strands=[],R;
  function rs(){S=cv.width=cv.height=cv.clientWidth*dpr;R=S/2;build();draw(state.p);}
  function build(){
    strands=[];var rnd=mulberry(7);
    for(var i=0;i<46;i++){var r0=.12+rnd()*.66,a0=rnd()*6.283,len=1.2+rnd()*2.4,w=.75+rnd()*.5,pts=[];
      for(var k=0;k<=36;k++){var t=k/36;pts.push([r0+Math.sin(t*9+i)*.07+ (t-.5)*.18*(rnd()>.5?1:-1)*0, a0+t*len, w]);}
      strands.push({pts:pts,hue:rnd()});}
    negi=[];for(var j=0;j<14;j++)negi.push([.2+rnd()*.5,rnd()*6.283,rnd()]);
  }
  var negi=[];
  function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  var state={p:0,shown:-1};
  function col(p){var a=[242,232,196],b=[228,186,98];return "rgb("+[0,1,2].map(function(i){return Math.round(a[i]+(b[i]-a[i])*p);}).join(",")+")";}
  function draw(p){
    if(!S)return;c.clearRect(0,0,S,S);
    var cx=R,cy=R,rim=R*.98,inner=R*.86,turn=p*8*Math.PI*2;
    // bowl
    c.save();c.shadowColor="rgba(0,0,0,.6)";c.shadowBlur=R*.12;c.fillStyle="#f6f1e8";c.beginPath();c.arc(cx,cy,rim,0,6.283);c.fill();c.restore();
    c.strokeStyle="#2a2522";c.lineWidth=R*.012;c.beginPath();c.arc(cx,cy,rim*.965,0,6.283);c.stroke();
    c.strokeStyle="#b8963f";c.lineWidth=R*.006;c.beginPath();c.arc(cx,cy,rim*.94,0,6.283);c.stroke();
    // ornament band
    c.save();c.translate(cx,cy);c.rotate(turn*.02);
    for(var o=0;o<24;o++){c.rotate(6.283/24);c.fillStyle=o%2?"#c3221c":"#6f8fb0";c.globalAlpha=.55;c.beginPath();c.ellipse(rim*.905,0,R*.02,R*.008,0,0,6.283);c.fill();}
    c.restore();c.globalAlpha=1;
    // tare pool
    var g=c.createRadialGradient(cx,cy,0,cx,cy,inner);g.addColorStop(0,"rgba(120,70,20,"+(.55-.4*p)+")");g.addColorStop(1,"rgba(120,70,20,0)");
    c.fillStyle="#efe6d3";c.beginPath();c.arc(cx,cy,inner,0,6.283);c.fill();c.fillStyle=g;c.fill();
    c.save();c.beginPath();c.arc(cx,cy,inner,0,6.283);c.clip();
    // noodles
    var base=col(Math.min(1,p*1.15));
    strands.forEach(function(st,si){
      c.beginPath();
      st.pts.forEach(function(q,k){
        var r=q[0]*inner,tw=turn*(1.15-q[0]*.75)+Math.sin(turn*.5+si)*.25*p;
        var a=q[1]+tw,wob=Math.sin(k*.7+si+turn*.3)*R*.012;
        var x=cx+Math.cos(a)*(r+wob),y=cy+Math.sin(a)*(r+wob);
        if(k)c.lineTo(x,y);else c.moveTo(x,y);
      });
      c.lineCap="round";c.lineJoin="round";
      c.strokeStyle="rgba(90,60,20,.35)";c.lineWidth=R*.052*st.pts[0][2];c.stroke();
      c.strokeStyle=base;c.lineWidth=R*.04*st.pts[0][2];c.stroke();
      c.strokeStyle="rgba(255,255,240,.45)";c.lineWidth=R*.01;c.stroke();
    });
    // negi
    negi.forEach(function(n){var a=n[1]+turn*(1.1-n[0]*.7),r=n[0]*inner;var x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      c.strokeStyle="#5f9a3c";c.lineWidth=R*.012;c.beginPath();c.arc(x,y,R*.028,0,6.283);c.stroke();c.fillStyle="#d9ecbf";c.beginPath();c.arc(x,y,R*.016,0,6.283);c.fill();});
    // naruto
    if(naruto.complete&&naruto.naturalWidth){var a2=-1+turn*.85,r2=inner*.34,nx=cx+Math.cos(a2)*r2,ny=cy+Math.sin(a2)*r2,ns=R*.26;
      c.save();c.translate(nx,ny);c.rotate(turn*1.3);c.drawImage(naruto,-ns/2,-ns/2,ns,ns);c.restore();}
    // sheen
    var sh=c.createLinearGradient(0,0,S,S);sh.addColorStop(0,"rgba(255,255,255,.18)");sh.addColorStop(.5,"rgba(255,255,255,0)");c.fillStyle=sh;c.fillRect(0,0,S,S);
    c.restore();
  }
  function setCount(n){
    if(n===state.shown)return;state.shown=n;
    nEl.textContent=n;
    if(HAS_G&&!RM)gsap.fromTo(nEl,{yPercent:60,opacity:0},{yPercent:0,opacity:1,duration:.5,ease:"expo.out"});
    var t=say.getAttribute("data-s"+n)||say.getAttribute("data-s1");say.textContent=t;
    say.classList.toggle("red",n===7||n===8);
    ticks.forEach(function(el,i){el.classList.toggle("on",i<n);});
  }
  naruto.onload=function(){draw(state.p);};
  rs();window.addEventListener("resize",rs);setCount(0);
  if(!HAS_G||RM){draw(1);setCount(8);return;}
  ScrollTrigger.create({trigger:s,start:"top top",end:mobile?"+=180%":"+=300%",pin:true,scrub:true,
    onUpdate:function(st){state.p=st.progress;draw(st.progress);setCount(Math.min(8,Math.floor(st.progress*8.6)));}});
}

/* ---------- dishes, how, cta, footer ---------- */
function misc(){
  if(!HAS_G||RM)return;
  $$(".dc .im img").forEach(function(im){gsap.fromTo(im,{yPercent:-6},{yPercent:6,ease:"none",scrollTrigger:{trigger:im,start:"top bottom",end:"bottom top",scrub:true}});});
  if($(".how .steps")){
    gsap.fromTo(".how .st",{y:100,opacity:0},{y:0,opacity:1,stagger:.18,duration:1.3,ease:"expo.out",scrollTrigger:{trigger:".how .steps",start:"top 80%"}});
    var p=$(".how .arrowline path");if(p){var L=p.getTotalLength();gsap.fromTo(p,{strokeDashoffset:L,strokeDasharray:L},{strokeDashoffset:0,duration:2,ease:"power2.inOut",scrollTrigger:{trigger:".how .steps",start:"top 75%"}});}
    gsap.to(".how .st:first-child .il img",{rotate:4,yoyo:true,repeat:-1,duration:.35,ease:"sine.inOut",transformOrigin:"50% 90%"});
  }
  if($(".cta .bigt")){var cc=split($(".cta .bigt"));
    gsap.fromTo(cc,{yPercent:100,opacity:0},{yPercent:0,opacity:1,stagger:.06,duration:1.2,ease:"expo.out",scrollTrigger:{trigger:".cta",start:"top 70%"}});
    $$(".cta .ring").forEach(function(r,i){gsap.fromTo(r,{width:0,height:0,opacity:.8},{width:"160vmax",height:"160vmax",opacity:0,duration:6,repeat:-1,delay:i*2,ease:"power1.out"});});}
  $$(".ft .giant").forEach(function(g){gsap.fromTo(g,{xPercent:0},{xPercent:-30,ease:"none",scrollTrigger:{trigger:".ft",start:"top bottom",end:"bottom bottom",scrub:true}});});
  $$(".board").forEach(function(b){b.addEventListener("mousemove",function(e){var r=b.getBoundingClientRect();b.style.setProperty("--mx",(e.clientX-r.left)+"px");b.style.setProperty("--my",(e.clientY-r.top)+"px");});});
  $$(".tp").forEach(function(t,i){gsap.fromTo(t,{y:40,opacity:0},{y:0,opacity:1,duration:.9,ease:"expo.out",delay:(i%4)*.08,scrollTrigger:{trigger:t,start:"top 92%"}});});
}

/* ---------- sub-page hero ---------- */
function phero(){
  var h=$(".phero");if(!h)return;
  var t=split($("h1",h));
  if(!HAS_G||RM)return;
  gsap.fromTo(t,{yPercent:110,rotate:12,opacity:0},{yPercent:0,rotate:0,opacity:1,stagger:.1,duration:1.4,ease:"expo.out",delay:.3});
  gsap.fromTo($(".bg img",h),{scale:1.3},{scale:1,duration:2.6,ease:"expo.out"});
  gsap.to($(".bg img",h),{yPercent:15,ease:"none",scrollTrigger:{trigger:h,start:"top top",end:"bottom top",scrub:true}});
  gsap.fromTo([$(".sub",h),$(".eyebrow",h),$(".side",h)],{y:30,opacity:0},{y:0,opacity:1,duration:1.2,ease:"expo.out",stagger:.12,delay:.7});
}

/* ---------- kodawari chapters ---------- */
function chapters(){
  var ch=$(".chap");if(!ch)return;
  var pics=$$(".sticky .pic",ch),num=$(".sticky .num span",ch),bar=$(".sticky .bar i",ch),items=$$(".it",ch);
  function set(i){pics.forEach(function(p,k){p.classList.toggle("on",k===i);});if(num)num.style.transform="translateY("+(-i)+"em)";if(bar)bar.style.transform="translateY("+(i*100)+"%)";}
  set(0);
  if(!HAS_G||RM)return;
  items.forEach(function(it,i){
    ScrollTrigger.create({trigger:it,start:"top 55%",end:"bottom 55%",onToggle:function(st){if(st.isActive)set(i);}});
    gsap.fromTo($$(".k,h2,p",it),{y:50,opacity:0},{y:0,opacity:1,stagger:.12,duration:1.2,ease:"expo.out",scrollTrigger:{trigger:it,start:"top 70%"}});
  });
}
function quote(){
  var q=$(".quote blockquote");if(!q)return;var c=split(q);
  if(!HAS_G||RM){c.forEach(function(x){x.classList.add("lit");});return;}
  ScrollTrigger.create({trigger:q,start:"top 75%",end:"bottom 45%",scrub:true,onUpdate:function(st){var n=Math.round(st.progress*c.length);c.forEach(function(x,i){x.classList.toggle("lit",i<n);});}});
}

/* ---------- menu hotspots ---------- */
function hotspots(){
  var f=$(".dish .fig");if(!f)return;
  var svg=$("svg.lines",f),hs=$$(".hot",f);
  function layout(){
    var W=f.clientWidth,H=f.clientHeight;svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.innerHTML="";
    hs.forEach(function(h){
      var px=parseFloat(h.dataset.px)/100*W,py=parseFloat(h.dataset.py)/100*H,lx=parseFloat(h.dataset.lx)/100*W,ly=parseFloat(h.dataset.ly)/100*H;
      h.style.left=lx+"px";h.style.top=ly+"px";
      var p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d","M"+px+","+py+" L"+(px+(lx-px)*.6)+","+ly+" L"+lx+","+ly);svg.appendChild(p);
      var c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("cx",px);c.setAttribute("cy",py);c.setAttribute("r",6);svg.appendChild(c);
      h._p=p;h._c=c;
    });
  }
  layout();window.addEventListener("resize",layout);
  var fimg=$("img",f);if(fimg&&!fimg.complete)fimg.addEventListener("load",function(){layout();if(HAS_G)ScrollTrigger.refresh();});
  if(!HAS_G||RM)return;
  var tl=gsap.timeline({scrollTrigger:{trigger:f,start:"top 60%"}});
  hs.forEach(function(h,i){var L=h._p.getTotalLength();
    tl.fromTo(h._c,{scale:0,transformOrigin:"center",transformBox:"fill-box"},{scale:1,duration:.4,ease:"back.out(3)"},i*.25)
      .fromTo(h._p,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,duration:.7,ease:"power2.inOut"},i*.25+.1)
      .fromTo(h,{opacity:0,scale:.6},{opacity:1,scale:1,duration:.6,ease:"back.out(2)"},i*.25+.6);});
}

/* ---------- boot ---------- */
function start(){
  if(sessionStorage&&(function(){try{return sessionStorage.getItem("abura-wipe")==="1";}catch(x){return false;}})()){try{sessionStorage.removeItem("abura-wipe");}catch(x){}wipeOut();}
  hero();phero();onko();mix();reveals();marquees();odometers();misc();chapters();quote();hotspots();
  if(HAS_G)ScrollTrigger.refresh();
}
window.addEventListener("pageshow",function(e){if(e.persisted&&wipe&&HAS_G){gsap.set($$("i",wipe),{scaleY:0});wipe.style.pointerEvents="none";}});
function boot(){runLoader(start);}
if(document.fonts&&document.fonts.ready){Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1500);})]).then(boot);}else boot();
})();
