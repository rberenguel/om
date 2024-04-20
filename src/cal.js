export { cal, calWithEvents, parseCalendar };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { parseInto, iterateDOM } from "./parser.js";

const cal = {
  text: ["cal"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.lastBodyClickId());
    /*const testEvs = {
      1: "foo\nbar",
      15: "floop",
      25: "[link](google.com)",
      12: "- foo\n- bar\n- baz",
    };*/
    let today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const table = calWithEvents({ month: month, year: year }, body);
    body.appendChild(table);
  },
  description: "Add a calendar on this panel",
  el: "u",
};

const calWithEvents = (events, mode) => {
  // TODO read selection to know which month, default to current
  const year = events.year;
  const month = events.month;
  const date = new Date(year, events.month, 1);
  const monthName = date.toLocaleString("default", { month: "long" });
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

  const table = document.createElement("table");
  table.classList.add("calendar");
  const caption = document.createElement("caption");
  caption.classList.add("calendar");
  caption.textContent = `${monthName} ${year}`;
  caption.contentEditable = false;
  table.appendChild(caption);
  const tbody = document.createElement("tbody");
  tbody.classList.add("calendar");
  let trh, trp;
  const populateRow = () => {
    trh = document.createElement("tr");
    trh.classList.add("calendar");
    trh.classList.add("heading");
    trp = document.createElement("tr");
    trp.classList.add("calendar");
    trp.classList.add("stuff");
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
    if (dayPair.short == "S") {
      tdh.classList.add("weekend");
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
    if (dayPair.short == "S") {
      //pl.classList.add("weekend")
    }
    pl.id = `for-day-${dayPair.day}`;
    //plsp.classList.add("placeholder")
    const event = events[dayPair.day];
    if (event) {
      const divd = event.replaceAll("´", "`").replace(/^(\\n)+/, "");
      const nonl1 = divd.replaceAll("\n\n", "\n");
      const nonl2 = nonl1.replaceAll("\n\n", "\n");
      parseInto(nonl2, plsp, "noDrag");
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
  return table;
};

const parseCalendar = (table) => {
  const caption = table.querySelector("caption");
  const [monthName, year] = caption.textContent.split(" ");
  const monthIndex = new Date(monthName + " 1, " + year).getMonth(); // Assumes the first of the month
  const stuffz = Array.from(table.querySelectorAll("td.stuff"));
  let events = { month: monthIndex, year: year };
  for (const stuff of stuffz) {
    if (stuff.textContent.trim() != "") {
      // TODO the fixer for multi-new lines might be needed in these situations?
      const parsed = iterateDOM(stuff, "foldNL").join("");
      //console.log(parsed)
      const date = stuff.id.replace("for-day-", "");
      events[date] = parsed.replaceAll("`", "´"); // TODO it's a horrible trick, but gets the work done
    }
  }
  return events;
};
