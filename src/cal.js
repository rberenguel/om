export { cal };

import weave from "./weave.js";
import { common } from "./commands_base.js";
//import { DateTime } from "../lib/luxon.js"
import { parseInto } from "./parser.js";
const cal = {
  text: ["cal"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.lastBodyClickId());
    const testEvs = {1: "foo\nbar", 15: "floop", 25: "[link](google.com)", 12: "- foo\n- bar\n- baz"}
    calWithEvents(testEvs, body)
  },
  description: "Add a calendar on this panel",
  el: "u",
};

const calWithEvents = (events, body) => {
    // TODO read selection to know which month, default to current
    let today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDate();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // Will this work for December?
    console.log(firstDayOfMonth, lastDayOfMonth);
    const dayShort = ["S", "M", "T", "W", "T", "F", "S"];
    let daygrid = [];
    for (let i = firstDayOfMonth; i <= lastDayOfMonth; i++) {
      const day = new Date(year, month, i);
      const dayD = day.getDay();
      daygrid.push({ day: day.getDate(), short: dayShort[dayD] });
    }
    console.log(daygrid);
    
    const table = document.createElement("table");
    table.classList.add("calendar");
    const tbody = document.createElement("tbody");
    tbody.classList.add("calendar");
    let trh, trp;
    const populateRow = () => {
      trh = document.createElement("tr");
      trh.classList.add("calendar");
      trh.classList.add("heading")
      trp = document.createElement("tr");
      trp.classList.add("calendar");
      trp.classList.add("stuff")
    };
    //
    let dayCounter = 1; // Want to start on Mondays
    for (const dayPair of daygrid) {
      if ((dayCounter - 1) % 7 == 0) {
        populateRow();
        tbody.appendChild(trh);
        tbody.appendChild(trp);
      }
      console.log(dayCounter, dayPair);
      dayCounter = dayCounter % 7;
      const dayOfGrid = dayShort[dayCounter];
      dayCounter += 1;
      if (dayOfGrid != dayPair.short) {
        continue;
      }
      const tdh = document.createElement("td");
      tdh.classList.add("calendar");
      tdh.classList.add("day-head");
      if(dayPair.short == "S"){
        tdh.classList.add("weekend")
      }
      tdh.contentEditable = false;
      const dtsp = document.createElement("span");
      dtsp.classList.add("calendar");
      dtsp.classList.add("date");
      dtsp.textContent = dayPair.day;
      const dysp = document.createElement("span");
      dysp.classList.add("calendar");
      dysp.classList.add("day");
      dysp.textContent = dayPair.short;
      dtsp.contentEditable = false;
      dysp.contentEditable = false;
      const pl = document.createElement("td");
      const plsp = document.createElement("span");
      pl.classList.add("calendar");
      pl.classList.add("stuff");
      if(dayPair.short == "S"){
        //pl.classList.add("weekend")
      }
      pl.id = `for-day-${dayPair.day}`;
      //plsp.classList.add("placeholder")
      const event = events[dayPair.day]
      if(event){
        parseInto(event, plsp)
      } else {
        plsp.innerHTML = "&nbsp;";
      }
      pl.appendChild(plsp);
      tdh.appendChild(dtsp);
      tdh.appendChild(dysp);
      trh.appendChild(tdh);
      trp.appendChild(pl);
    }
    table.appendChild(tbody);
    body.appendChild(table);
}