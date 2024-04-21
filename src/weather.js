export { weather };

import weave from "./weave.js";
import { common } from "./commands_base.js";


const weather = {
  text: ["weather"],
  action: async (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.lastBodyClickId());
    const selection = window.getSelection();
    const text = `${selection+""}`
    let range = selection.getRangeAt(0);
    range.deleteContents();
    weatherFor(text).then(table => {
      body.appendChild(table);
    }).catch(err => {
      console.error("Failed");
      console.error(err)
    })
  },
  description: "Add a weather forecast. It is not persisted",
  el: "u",
};

async function geocoding(city){
  // It shots with I'm feeling lucky
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
  const geo = await response.json();
  console.info(`Geo resolved details: ${geo}`)
  return {
    lat: geo.results[0].latitude,
    lon: geo.results[0].longitude,
  }
}

async function dayForecast(table, geo){
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,rain&hourly=temperature_2m,precipitation_probability,rain&forecast_days=1`);
  const weather = await response.json();
  const date = new Date();
  const currentHour = date.getHours();
  const tbody = document.createElement("TBODY")
  for(let i=currentHour; i<weather.hourly.time.length;i++){
    const tr = document.createElement("TR")
    const hour = weather.hourly.time[i]
    const temp = weather.hourly.temperature_2m[i]
    const prec_prob = weather.hourly.precipitation_probability[i]
    const rain = weather.hourly.rain[i]
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
  return table

}

async function weekForecast(table, geo){
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&daily=temperature_2m_max,temperature_2m_min,rain_sum,precipitation_probability_max&forecast_days=10`);
  const weather = await response.json();
  const tbody = document.createElement("TBODY")
  for(let i=0; i<weather.daily.time.length;i++){
    const tr = document.createElement("TR")
    const day = weather.daily.time[i]
    const tempMax = weather.daily.temperature_2m_max[i]
    const tempMin = weather.daily.temperature_2m_min[i]
    const prec_prob = weather.daily.precipitation_probability_max[i]
    const rain = weather.daily.rain_sum[i]
    
    const tdh = document.createElement("TD")
    tdh.classList.add("clock")
    let d = document.createElement("DIV")
    d.classList.add("dynamic-div")
    d.classList.add("ad")
    d.classList.add("cal")
    d.textContent = day
    tdh.appendChild(d)
    const tdtMax = document.createElement("TD")
    d = document.createElement("DIV")
    d.classList.add("dynamic-div")
    d.classList.add("ad")
    d.classList.add("temp")
    d.textContent = tempMax
    if(+tempMax <= 10){
      d.style.setProperty("--before-color",  "#333399");
    }
    else if(+tempMax > 10 && +tempMax < 22){
      d.style.setProperty("--before-color", "#CC6633");
    } else {
      d.style.setProperty("--before-color",   "#ff3333");
    }
    tdtMax.appendChild(d)    
    const tdtMin = document.createElement("TD")
    d = document.createElement("DIV")
    d.classList.add("dynamic-div")
    d.classList.add("ad")
    d.classList.add("temp")
    d.textContent = tempMin
    if(+tempMin <= 10){
      d.style.setProperty("--before-color",  "#333399");
    }
    else if(+tempMin > 10 && +tempMin < 22){
      d.style.setProperty("--before-color", "#CC6633");
    } else {
      d.style.setProperty("--before-color",   "#ff3333");
    }
    tdtMin.appendChild(d)
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
    tr.appendChild(tdtMin)
    tr.appendChild(tdtMax)
    tr.appendChild(tdpp)
    tr.appendChild(tdr)
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  return table
}

const createTable = (city) => {
  const table = document.createElement("TABLE")
  table.classList.add("weather-table")
  const caption = document.createElement("CAPTION")
  caption.textContent = `${city} weather`
  table.appendChild(caption)
  return table
}

async function weatherFor(city) {
  const geo = await geocoding(city.replace("+", ""))
  const table = createTable(city.replace("+", ""))
  if(city.endsWith("+")){
    return await weekForecast(table, geo)
  }
  return await dayForecast(table, geo)
}
