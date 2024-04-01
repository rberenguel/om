export { GuillotineJS };

const GuillotineJS = (start) => {
  let generated = false;

  const centerCutoff = (x, y) => {
    coverElement.style.top = y + "px";
    coverElement.style.left = x + "px";
    coverElement.style.position = "fixed";
  };

  document.onkeydown = (e) => {
    if (e.key.toLowerCase() == "v" && e.ctrlKey && e.shiftKey && !generated) {
      init();
      e.preventDefault();
    }
  };

  const videoElement = document.createElement("video");

  const videoSelectorElement = document.createElement("select");
  videoSelectorElement.id = "guillotine-selector";
  const lower =
    "font-size: 14px !important; position: absolute; font-family: monoidregular;";
  let helpP = document.createElement("p");
  let helpText = document.createTextNode(
    "Tap on dotted frame to give it focus and press h for help",
  );
  helpP.appendChild(helpText);
  helpP.style = lower + "right: 5px; bottom: 0px;";
  videoSelectorElement.id = "guillotine-selector";
  videoSelectorElement.style = "height: 15px; bottom: 5px;" + lower;

  const coverElement = document.createElement("div");

  coverElement.id = "guillotine-cover";
  coverElement.style =
    "height: 200px; width: 200px; position: relative; display: inline-block; object-fit: cover; overflow: hidden; border: 2px dashed #c60; background-color: rgba(0, 0, 0, 0.005); z-index: 10000; outline: none;";

  coverElement.tabIndex = 0;

  videoElement.id = "guillotine-video";
  videoElement.style =
    "position: absolute; width: 800px; height: 600px; top: 5px; left:  5px; scale: 1; z-index: 5000;";
  videoElement.autoplay = true;

  const videoWrapperElement = document.createElement("div");

  videoWrapperElement.id = "#guillotine-video-wrapper";

  videoWrapperElement.style = "height: 200px; width: 200px;";

  videoWrapperElement.appendChild(coverElement);

  videoWrapperElement.appendChild(videoElement);
  videoWrapperElement.appendChild(videoSelectorElement);
  videoWrapperElement.appendChild(helpP);

  const modalElement = document.createElement("div");

  modalElement.id = "guillotine-modal";
  modalElement.style =
    "left: 0px; top: 0px; position: fixed; border: 2px solid #c60; border-radius: 5px; height: 630px; width: 810px; color: #fdf6e3; background-color: #002b36;; z-index: 5000; visibility: hidden;" +
    lower;

  let helpElement = document.createElement("div");
  helpElement.style =
    "font-family: monoidregular; visibility: hidden; display: none; font-size: 110%; width: 40%; margin: auto; margin-top: 10%;";
  let pStyle = "margin: 0; font-size: 110%;";

  let m = document.createElement("p");
  m.style = pStyle;
  let mText = document.createTextNode("-: Make frame smaller");
  m.appendChild(mText);
  let p = document.createElement("p");
  p.style = pStyle;
  let pText = document.createTextNode("+: Make frame larger");
  p.appendChild(pText);
  let r = document.createElement("p");
  r.style = pStyle;
  let rText = document.createTextNode("R: Make frame rounder");
  r.appendChild(rText);
  let s = document.createElement("p");
  s.style = pStyle;
  let sText = document.createTextNode("S: Make frame squarer");
  s.appendChild(sText);
  let h = document.createElement("p");
  h.style = pStyle;
  let hText = document.createTextNode("h: Make this go away");
  h.appendChild(hText);
  let sp = document.createElement("p");
  sp.style = pStyle;
  let spText = document.createTextNode("SPACE: Cut off frame");
  sp.appendChild(spText);
  let desc = document.createElement("p");
  desc.style = pStyle;
  desc.innerHTML =
    "<a href='https://github.com/rberenguel/GuillotineJS' target='_blank' style='font-size: 70%'>GuillotineJS by Ruben Berenguel, 2021</a><br/><br/> You can use your scroll wheel to adjust the size of the frame, or the shortcuts below. <br/><br/> Once the frame has been cut, you can still use +/-/R/S to reshape the floating cut camera<br/><br/>";
  helpElement.append(desc, p, m, r, s, h, sp);
  modalElement.appendChild(helpElement);
  modalElement.appendChild(videoWrapperElement);
  document.querySelector("#content").appendChild(modalElement);

  let coverTransform = {
    x: 0,
    y: 0,
    scale: 1,
    radius: 50,
    borderType: "px dashed #c60",
  };

  const transformElement = (element, transform, scaleFirst) => {
    let str = "";
    if (scaleFirst) {
      str += ` scale(${transform.scale})`;
    }
    if (transform.x !== undefined) {
      str += `translate(${transform.x}px,${transform.y}px)`;
    }
    if (transform.scale !== undefined && !scaleFirst) {
      str += ` scale(${transform.scale})`;
    }
    element.style.transform = str;
    if ("radius" in transform) {
      element.style["border-radius"] = transform.radius + "%";
    }
  };

  const generateFloatingDiv = (arg) => {
    const scale = 1 / coverTransform.scale;
    const scaledOffsetX = (800 - 800 * scale) / 2;
    const scaledOffsetY = (600 - 600 * scale) / 2;
    videoElement.style.top = -scaledOffsetY + "px";
    videoElement.style.left = -scaledOffsetX + "px";
    let x =
      -arg.coverOffset.left + arg.videoOffset.left - 2 / coverTransform.scale;
    let y =
      -arg.coverOffset.top + arg.videoOffset.top - 2 / coverTransform.scale;
    videoElement.style.transform = transformElement(
      videoElement,
      {
        x: x,
        y: y,
        scale: 1 / coverTransform.scale,
      },
      true,
    );
    coverTransform.borderType = "px solid #c60";
    coverElement.style.border =
      1 / coverTransform.scale + coverTransform.borderType; // This used to be 2 /
    coverElement.appendChild(videoElement);
    videoElement.addEventListener("wheel", (e) => {
      coverScale(e);
      e.preventDefault();
    });
    document.querySelector("#content").appendChild(coverElement);
    modalElement.remove();
    generated = true;
  };

  const gotStream = (stream) => {
    window.stream = stream;
    videoElement.srcObject = stream;
  };

  const getStream = (forcedDevice) => {
    const device = videoSelectorElement.value || forcedDevice;
    if (window.stream) {
      window.stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }

    let video = {
      width: {
        ideal: 800,
      },
      height: {
        ideal: 600,
      },
      deviceId: device
        ? {
            exact: device,
          }
        : undefined,
    };
    const constraints = {
      audio: false,
      video: video,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotStream)
      .catch(handleError);
  };

  // TODO: Refactor to move this

  videoSelectorElement.onchange = getStream;

  const handleError = (error) => {
    console.error("Error: ", error);
  };

  const configureDrag = (elementQ) => {
    let container = document.querySelector(elementQ);
    let rect = container.getBoundingClientRect();
    let active = false;
    let currentX, currentY, initialX, initialY;
    let xOffset = coverTransform.x,
      yOffset = coverTransform.y;
    const dragStart = (ev) => {
      if (ev.type === "touchstart") {
        initialX = ev.touches[0].clientX - xOffset;
        initialY = ev.touches[0].clientY - yOffset;
      } else {
        initialX = ev.clientX - xOffset;
        initialY = ev.clientY - yOffset;
      }
      if (ev.target === container || ev.target === videoElement) {
        active = true;
      }
    };

    const drag = (ev) => {
      if (active) {
        ev.preventDefault();

        if (ev.type === "touchmove") {
          currentX = ev.touches[0].clientX - initialX;
          currentY = ev.touches[0].clientY - initialY;
        } else {
          currentX = ev.clientX - initialX;
          currentY = ev.clientY - initialY;
        }
        let top = currentY;
        let left = currentX;
        coverTransform.x = left;
        coverTransform.y = top;

        xOffset = currentX;
        yOffset = currentY;

        transformElement(coverElement, coverTransform);
      }
    };

    const dragEnd = () => {
      initialX = currentX;
      initialY = currentY;
      active = false;
    };
    container.addEventListener("touchstart", dragStart, false);
    container.addEventListener("touchend", dragEnd, false);
    container.addEventListener("touchmove", drag, false);

    container.addEventListener("mousedown", dragStart, false);
    container.addEventListener("mouseup", dragEnd, false);
    container.addEventListener("mousemove", drag, false);
  };

  const largerFrame = () => {
    if (coverTransform.scale > 8) {
      return;
    }
    coverTransform.scale *= 1.03;
    transformElement(coverElement, coverTransform);
    coverElement.style.border =
      2 / coverTransform.scale + coverTransform.borderType;
  };

  const smallerFrame = () => {
    if (coverTransform.scale < 0.1) {
      return;
    }
    coverTransform.scale /= 1.03;
    transformElement(coverElement, coverTransform);
    coverElement.style.border =
      2 / coverTransform.scale + coverTransform.borderType;
  };

  const coverScale = (e) => {
    if (e.deltaY > 0) {
      largerFrame();
    } else if (e.deltaY < 0) {
      smallerFrame();
    }
  };

  const makeRounder = () => {
    let radius = coverTransform.radius;
    radius = radius + 5;
    if (radius >= 50) {
      radius = 50;
    }
    coverTransform.radius = radius;
    transformElement(coverElement, coverTransform);
  };

  const makeSquarer = () => {
    let radius = coverTransform.radius;
    radius = radius - 5;
    if (radius < 0) {
      radius = 0;
    }
    coverTransform.radius = radius;
    transformElement(coverElement, coverTransform);
  };

  for (let element of [coverElement, videoElement]) {
    element.onkeydown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key == " " && !generated) {
        generate();
      }
      if (e.key == "r") {
        makeRounder();
      }
      if (e.key == "s") {
        makeSquarer();
      }
      if (e.key == "-") {
        smallerFrame();
      }
      if (e.key == "+") {
        largerFrame();
      }
      if (e.key == "h") {
        console.log("Help showing");
        let vis = helpElement.style.visibility;
        if (vis == "visible") {
          helpElement.style.visibility = "hidden";
          helpElement.style.display = "none";
          videoWrapperElement.style.visibility = "visible";
        } else {
          helpElement.style.visibility = "visible";
          helpElement.style.display = "block";
          videoWrapperElement.style.visibility = "hidden";
        }
      }
    };
  }

  const centerCover = () => {
    const left = 800 / 2 - 100;
    const top = 600 / 2 - 100;
    coverTransform.x = left;
    coverTransform.y = top;
    transformElement(coverElement, coverTransform);
  };

  const gotDevices = (deviceInfos) => {
    let videoDevices = {};
    for (let i = 0; i !== deviceInfos.length; ++i) {
      const deviceInfo = deviceInfos[i];
      const option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === "videoinput") {
        option.text =
          deviceInfo.label || "camera " + (videoSelectorElement.length + 1);
        videoSelectorElement.appendChild(option);
      } else {
        console.log("Found another kind of device: ", deviceInfo);
      }
    }
  };

  const generate = () => {
    let rect = coverElement.getBoundingClientRect();
    let coverOffset = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
      top: rect.top,
      left: rect.left,
    };
    rect = videoElement.getBoundingClientRect();
    let videoOffset = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
      top: rect.top,
      left: rect.left,
    };
    generateFloatingDiv({
      width: coverOffset.width,
      height: coverOffset.height,
      videoWidth: videoOffset.width,
      videoHeight: videoOffset.height,
      coverOffset: coverOffset,
      videoOffset: videoOffset,
      coverTransform: coverTransform,
    });
  };

  const init = () => {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    navigator.mediaDevices
      .enumerateDevices()
      .then(gotDevices)
      .then(getStream());
    modalElement.style.top = (window.innerHeight - 600) / 2 + "px";
    modalElement.style.left = (window.innerWidth - 800) / 2 + "px";
    modalElement.style.visibility = "visible";
    centerCover();
    coverElement.addEventListener("wheel", (e) => {
      coverScale(e);
      e.preventDefault();
    });
    configureDrag("#guillotine-cover");
  };
  if (start) {
    init();
  }
};
