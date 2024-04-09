export { createOrMoveArrowBetweenDivs };

const createOrMoveArrowBetweenDivs = (id, svgId = "canvas") => {
  console.log(id)
  const [srcb, dstb] = id.split("-");
  console.log(srcb, dstb)
  const div1 = document.getElementById(srcb).closest(".body-container");
  const div2 = document.getElementById(dstb).closest(".body-container");
  const svg = document.getElementById(svgId);
  console.log(div1, div2, svg);
  if (!div1 || !div2 || !svg) {
    console.log(div1, div2, svg);
    console.error("Elements not found.");
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
  }
  arrow.setAttribute("id", id);
  arrow.setAttribute("x1", x1);
  arrow.setAttribute("y1", y1);
  const dy = y2 - y1
  const dx = x2 - x1
  const arrowAngle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx*dx+dy*dy)
  const r = Math.max(div2Rect.width, div2Rect.height)/2
  const isXCloser = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  
  let intersectX, intersectY;
  console.log(arrowAngle)
  intersectX = x1+Math.cos(arrowAngle) * (length-r)
  intersectY = y1+Math.sin(arrowAngle) * (length-r)

  /*if (arrowAngle > Math.PI / 2) {
    intersectX = div2EdgeX;
    intersectY = div2EdgeY + Math.sin(arrowAngle) * (div2Rect.height / 2 - 2);
  }
  if (arrowAngle < Math.PI / 2) {
    intersectX = div2EdgeX + Math.cos(arrowAngle) * (div2Rect.height / 2 - 2);
    intersectY = div2EdgeY
  }*/

  arrow.setAttribute("x2", intersectX);
  arrow.setAttribute("y2", intersectY);
  //arrow.setAttribute('x2', x2);
  //arrow.setAttribute('y2', y2);
  arrow.setAttribute("stroke", "black");
  arrow.setAttribute("stroke-width", 2);
  arrow.setAttribute("marker-end", "url(#arrowhead)");
  arrow.setAttribute("class", "arrow-line");

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker"
  );
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "8");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("orient", "auto-start-reverse");
  marker.setAttribute("class", "arrow-line");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  path.setAttribute("fill", "black");

  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);
  svg.appendChild(arrow);
};
