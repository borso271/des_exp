import * as nested from '../vendor/nested.js';
import * as moving from '../vendor/moving.js';
export function create(canvas,preset) {
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)throw new Error('Canvas unavailable');
  return {
    update(next){preset=next;},
    render(width,height,time) {
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      context.fillStyle=preset.palette[0];context.fillRect(0,0,width,height);
      const geometry=preset.renderer==='squares'?nested:moving;
      const result=geometry.build({...preset.geometry,seed:preset.seed,
        time:(preset.motion.initialTime||0)+time*preset.motion.speed},width,height);
      for(const shape of result.shapes) {
        geometry.trace(context,shape);
        const color=preset.palette[(shape.index+(preset.renderer==='squares'?1:0))%preset.palette.length];
        context.fillStyle=color;context.fill();
        if(preset.renderer==='moving'){context.strokeStyle=color;context.lineWidth=.7;context.stroke();}
      }
      if(preset.renderer==='squares') {
        const wash=context.createLinearGradient(0,0,width,height);
        wash.addColorStop(0,'#ffffff09');wash.addColorStop(.5,'#00000000');wash.addColorStop(1,'#00000016');
        context.fillStyle=wash;context.fillRect(0,0,width,height);
      }
    }, dispose(){canvas.width=1;canvas.height=1;}
  };
}
