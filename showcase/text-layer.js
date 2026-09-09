// One DOM text layer for every art engine; the fixed logo retains its SVG mask.
export function createTextLayer(stage,element,{ResizeObserver:Observer=ResizeObserver}={}){
  const doc=element.ownerDocument;
  const logo=element.querySelector('.page-homeHeroBrandLogo');
  const copy=doc.createElement('div');copy.className='banner-copy';element.appendChild(copy);
  let settings=null,disposed=false;
  const span=(text,className)=>{const node=doc.createElement('span');node.textContent=text;node.className=className;return node;};
  function layout(){
    if(!settings||disposed)return;
    const t=settings,rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const defaultLogo=t.mode==='logo'&&t.width===61;
    const mobile=doc.defaultView.matchMedia('(max-width:47.9375rem)').matches;
    const width=defaultLogo?Math.min(rect.width*(mobile?.82:.61),mobile?384:800):rect.width*t.width/100;
    element.style.width=`${width}px`;element.style.color=t.color;
    element.style.fontFamily=t.font;element.style.fontWeight=t.weight;element.style.lineHeight=t.lineHeight;
    copy.style.textAlign=t.align;copy.style.width='100%';
    if(t.mode!=='logo'&&t.mode!=='none'){
      let size=rect.width*t.size/100;
      if(t.mode==='manifesto'){
        const bottom=copy.querySelector('.banner-manifesto-bottom');
        copy.style.fontSize='100px';
        const measured=bottom.getBoundingClientRect().width;
        if(measured>0)size=Math.min(size,100*width/measured);
      }
      copy.style.fontSize=`${size}px`;
      // Long custom copy fits the available height, including on portrait banners.
      for(let i=0;i<3&&copy.scrollHeight>rect.height*.86;i++){
        size*=rect.height*.86/copy.scrollHeight;copy.style.fontSize=`${size}px`;
      }
      if(t.mode==='manifesto')copy.style.width=`${copy.querySelector('.banner-manifesto-bottom').getBoundingClientRect().width}px`;
    }
    const height=element.getBoundingClientRect().height;
    const x=Math.max(width/2+rect.width*.02,Math.min(rect.width-width/2-rect.width*.02,rect.width*t.x/100));
    const desired=t.vertical==='top'?height/2+rect.height*.05:t.vertical==='bottom'?rect.height*.95-height/2:t.vertical==='center'?rect.height/2:rect.height*t.y/100;
    const y=Math.max(height/2,Math.min(rect.height-height/2,desired));
    element.style.left=`${x}px`;element.style.top=`${y}px`;
  }
  function update(text){
    settings=text;element.hidden=text.mode==='none';element.dataset.textMode=text.mode;
    logo.hidden=text.mode!=='logo';copy.hidden=text.mode==='logo'||text.mode==='none';copy.replaceChildren();
    if(text.mode==='manifesto'){
      const top=span('','banner-manifesto-top');top.append(span('NO',''),span('SOMOS',''));
      copy.append(top,span('ESPECTADORES','banner-manifesto-bottom'));copy.lang='es';
    }else {copy.textContent=text.content;copy.removeAttribute('lang');}
    const label=text.mode==='logo'?'BE ART':text.mode==='manifesto'?'NO SOMOS ESPECTADORES':text.mode==='custom'?text.content:'';
    stage.setAttribute('aria-label',[label,stage.dataset.artDescription].filter(Boolean).join('. '));
    layout();
  }
  element.classList.add('banner-text');
  const observer=new Observer(layout);observer.observe(stage);
  doc.fonts?.ready.then(()=>{if(!disposed)layout();});
  doc.fonts?.addEventListener('loadingdone',layout);
  return {update,dispose(){disposed=true;observer.disconnect();doc.fonts?.removeEventListener('loadingdone',layout);}};
}
