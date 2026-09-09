import {DEFAULTS, LightRenderer} from '../vendor/triangle.js';
export function create(canvas,preset) {
  const renderer=new LightRenderer(canvas);
  return {
    update(next){preset=next;},
    render(width,height) {
      const [coreColor,seamColor,spillColor,ambientColor]=preset.palette;
      const parameters={...DEFAULTS,...preset.geometry,...preset.light,coreColor,seamColor,spillColor,ambientColor};
      if(renderer.gl.isContextLost())throw new Error('Context lost');
      // Geometry uses image-height units. Fit the triangle into a portrait banner.
      const fit=Math.min(1,width/height/.98);
      renderer.resize(width,height);
      renderer.render({...parameters,width:parameters.width*fit,height:parameters.height*fit,
        posY:.5+(parameters.posY-.5)*fit});
    },
    dispose(){renderer.dispose();renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();}
  };
}
