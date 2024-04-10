export { arrow, createOrMoveArrowBetweenDivs };

import { common } from "./commands_base.js";

const arrow = {
  text: ["arrow"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const srcb = weave.internal.bodyClicks[1]
    const dstb = weave.internal.bodyClicks[0]
    //createArrowBetweenDivs(src, dst)
    weave.internal.arrows.push(`${srcb}-${dstb}`)
    createOrMoveArrowBetweenDivs(weave.internal.arrows[0])
  },
  description: "Reparses the current panel through a fake markdown conversion",
  el: "u",
}


const createOrMoveArrowBetweenDivs = (id, svgId = "canvas") => {
  //console.log(id)
  const [srcb, dstb] = id.split("-");
  //console.log(srcb, dstb)
  const div1 = document.getElementById(srcb).closest(".body-container");
  const div2 = document.getElementById(dstb).closest(".body-container");
  const svg = document.getElementById(svgId);
  //console.log(div1, div2, svg);
  if (!div1 || !div2 || !svg) {
    //console.log(div1, div2, svg);
    //console.error("Elements not found.");
    return;
  }
  let arrow = document.getElementById(id);
  const div1Rect = div1.getBoundingClientRect();
  const div2Rect = div2.getBoundingClientRect();

  const x1 = div1Rect.left + div1Rect.width / 2;
  const y1 = div1Rect.top + div1Rect.height / 2;
  const x2 = div2Rect.left + div2Rect.width / 2;
  const y2 = div2Rect.top + div2Rect.height / 2;
  if (!arrow) {
    arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
    arrow.setAttribute("stroke-width", 2);
    //arrow.setAttribute("stroke", "black");
    arrow.setAttribute("marker-end", "url(#arrowhead)");
    arrow.setAttribute("class", "arrow-line");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "5");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("orient", "auto-start-reverse");
    marker.setAttribute("class", "arrow-line");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    path.setAttribute("fill", "black");

    marker.appendChild(path);
    defs.appendChild(marker);
    svg.appendChild(defs);
    svg.appendChild(arrow);

  }
  arrow.setAttribute("id", id);
  arrow.setAttribute("x1", x1);
  arrow.setAttribute("y1", y1);
  const r = Math.max(div2Rect.width, div2Rect.height)/2
  const div2EdgeX = x2 > x1 ? div2Rect.left : div2Rect.right;  // Determine correct edge
  const div2EdgeY = y2 > y1 ? div2Rect.top : div2Rect.bottom; 
  const dy = div2EdgeY - y1
  const dx = div2EdgeX - x1
  const arrowAngle = -Math.atan2(dy, dx);
  const length = Math.sqrt(dx*dx+dy*dy)
  let intersectX, intersectY;
  //console.log(arrowAngle)
  intersectX = x1+Math.cos(arrowAngle) * (length-r)
  intersectY = y1+Math.sin(arrowAngle) * (length-r)
  console.log(arrowAngle)
  intersectX =  (div2Rect.right + div2Rect.left)/2
  intersectY = (div2Rect.top + div2Rect.bottom)/2
   //}
  if(y1 + div1Rect.height/2 < div2EdgeY){
    // src is fully above
    intersectY = div2EdgeY-4
  }
  else if(y1 - div1Rect.height/2 > div2EdgeY){
    // src is fully below
    intersectY = div2EdgeY+1
  } 
  else {
    if(x1 + div1Rect.width/2 < div2EdgeX){
      // src is to the left
      intersectX = div2EdgeX-4
    } else {
      intersectX = div2EdgeX-4
    }
  }



  /*if(x1 < div2EdgeX){
    // Source is to the left
    intersectX = div2EdgeX
    intersectY = (div2Rect.top + div2Rect.bottom)/2
  } else {
    // Source is to the right
    intersectX =  (div2Rect.right + div2Rect.left)/2
    intersectY = div2EdgeY
 }*/
  arrow.setAttribute("x2", intersectX);
  arrow.setAttribute("y2", intersectY);
};
