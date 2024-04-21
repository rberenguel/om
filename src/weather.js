export { weather };

import weave from "./weave.js";
import { common } from "./commands_base.js";


// https://api.open-meteo.com/v1/forecast?latitude=47.3081&longitude=8.5318&current=temperature_2m,rain&hourly=temperature_2m,precipitation_probability,rain
//

const weather = {
  text: ["weather"],
  action: async (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.lastBodyClickId());
    await adliswil(body)
    console.log(table)
    //body.appendChild(table);
  },
  description: "Add a calendar on this panel",
  el: "u",
};

//https://api.open-meteo.com/v1/forecast?latitude=47.3081&longitude=8.5318&current=temperature_2m,rain&hourly=temperature_2m,precipitation_probability,rain&forecast_days=1



async function adliswil(body) {
  const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=47.3081&longitude=8.5318&current=temperature_2m,rain&hourly=temperature_2m,precipitation_probability,rain&forecast_days=1");
  const weather = await response.json();
  console.log(weather)
  console.log(weather.hourly)
  const table = document.createElement("TABLE")
  table.classList.add("weather-table")
  const caption = document.createElement("CAPTION")
  caption.textContent = "Adliswil weather"
  table.appendChild(caption)
  const tbody = document.createElement("TBODY")
  console.log(weather.hourly)
  for(let i=0; i<weather.hourly.time.length;i++){
    const tr = document.createElement("TR")
    const hour = weather.hourly.time[i]
    const temp = weather.hourly.temperature_2m[i]
    const prec_prob = weather.hourly.precipitation_probability[i]
    const rain = weather.hourly.rain[i]
    console.log(hour, temp, prec_prob, rain)
    const tdh = document.createElement("TD")
    tdh.classList.add("clock")
    let d = document.createElement("DIV")
    d.classList.add("dynamic-div")
    d.classList.add("ad")
    d.classList.add("clock")
    d.textContent = hour
    tdh.appendChild(d)
    const tdt = document.createElement("TD")
    d = document.createElement("DIV")
    d.classList.add("dynamic-div")
    d.classList.add("ad")
    d.classList.add("temp")
    d.textContent = temp
    if(+temp <= 10){
      d.style.setProperty("--before-color",  "#333399");
    }
    else if(+temp > 10 && +temp < 22){
      d.style.setProperty("--before-color", "#CC6633");
    } else {
     d.style.setProperty("--before-color",   "#ff3333");
    }
    tdt.appendChild(d)    
    const tdpp = document.createElement("TD")
    d = document.createElement("DIV")
    d.classList.add("dynamic-div")
    d.classList.add("ad")
    d.classList.add("umbr")
    d.classList.add("pct")
    d.textContent = prec_prob
    tdpp.appendChild(d)    
    const tdr = document.createElement("TD")
    d = document.createElement("DIV")
    d.classList.add("dynamic-div")
    d.classList.add("ad")
    d.classList.add("drop")
    d.textContent = rain
    tdr.appendChild(d)    
    tr.appendChild(tdh)
    tr.appendChild(tdt)
    tr.appendChild(tdpp)
    tr.appendChild(tdr)
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  body.appendChild(table)
  //return table
}
