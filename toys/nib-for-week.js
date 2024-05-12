// A silly example of an "injectable" script that just shows the last line

const currentDate = new Date();

// Adjust to get the next Sunday:
currentDate.setDate(currentDate.getDate() + (7 - currentDate.getDay()) % 7); 

const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
const daysPassed = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
const weekNumber = Math.ceil((daysPassed + startOfYear.getDay()) / 7);
const pens = ["Lamy Dialog", "Kaweco Liliput", "Twist Mystic", "Kaweco Sport Ruby", "Pilot VP"];

// Adjust week number for zero-based array, and handle case of week 53:
const choice = (weekNumber - 1) % pens.length; 

pens[choice]