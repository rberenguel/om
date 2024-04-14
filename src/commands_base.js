export { reset, common, enterKeyDownEvent };

const info = document.querySelector("#info");

const enterKeyDownEvent = new KeyboardEvent("keydown", {
  key: "Enter",
  code: "Enter",
  which: 13,
  keyCode: 13,
  bubbles: false,
});

const reset = () => {
  info.classList.remove("fades");
  info.innerText = "";
  const hl = document.getElementById("horizontal-line");
  hl.style.display = "none";
  const vl = document.getElementById("vertical-line");
  vl.style.display = "none";
};

const common = (ev, held) => {
  reset();
  if(!ev){
    return held
  }
  return held || ev.button !== 0 ;
};
