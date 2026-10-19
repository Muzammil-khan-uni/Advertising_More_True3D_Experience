(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)');if(reduce.matches||!matchMedia('(pointer:fine)').matches)return;
const cards=document.querySelectorAll('.feature-card');
cards.forEach(card=>{
 card.addEventListener('pointermove',e=>{
   const b=card.getBoundingClientRect(),nx=(e.clientX-b.left)/b.width-.5,ny=(e.clientY-b.top)/b.height-.5;
   card.style.setProperty('--tilt-y',(nx*9).toFixed(2)+'deg');
   card.style.setProperty('--tilt-x',(-ny*7).toFixed(2)+'deg');
   card.style.setProperty('--glint-x',((nx+.5)*100)+'%');
   card.style.setProperty('--glint-y',((ny+.5)*100)+'%');
 });
 card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-y','0deg');card.style.setProperty('--tilt-x','0deg');});
});
})();
