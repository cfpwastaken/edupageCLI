const { Edupage } = require('edupage-api');
const fs = require("fs");
const ora = require('ora');
const term = require("terminal-kit").terminal;

if(false) {
  console.error("JavaScript isnt working right now, please try again later.");
  process.exit(1);
}

const menuItems = ["Timetable", "Messages", "Assignments", "Exit"];

const menuOptions = {
  y: 1,
  style: term.inverse,
  selectedStyle: term.dim.blue.bgGreen
}

let spinner;

const edupage = new Edupage();

if(!fs.existsSync("./edupage.json")) {
  console.log("Please run node setup.js first");
  process.exit(1);
}

const credentials = require("./edupage.json");

async function timetable() {
  const yesterday = new Date();
  const tomorrow = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayTimetable = await edupage.getTimetableForDate(new Date());
  const yesterdayTimetable = await edupage.getTimetableForDate(yesterday);
  const tomorrowTimetable = await edupage.getTimetableForDate(tomorrow);

  const todayTable = [null, null, null, null, null, null, null, null, null, null];
  const yesterdayTable = [null, null, null, null, null, null, null, null, null, null];
  const tomorrowTable = [null, null, null, null, null, null, null, null, null, null];

  for(const lesson of todayTimetable.lessons) {
    todayTable[lesson.period.id - 1] = lesson.subject.name;
  }

  for(const lesson of yesterdayTimetable.lessons) {
    yesterdayTable[lesson.period.id - 1] = lesson.subject.name;
  }

  for(const lesson of tomorrowTimetable.lessons) {
    tomorrowTable[lesson.period.id - 1] = lesson.subject.name;
  }

  term.table(
    [
      ["", "yesterday", "today", "tomorrow"],
      ["1", yesterdayTable[0], todayTable[0], tomorrowTable[0]],
      ["2", yesterdayTable[1], todayTable[1], tomorrowTable[1]],
      ["3", yesterdayTable[2], todayTable[2], tomorrowTable[2]],
      ["4", yesterdayTable[3], todayTable[3], tomorrowTable[3]],
      ["5", yesterdayTable[4], todayTable[4], tomorrowTable[4]],
      ["6", yesterdayTable[5], todayTable[5], tomorrowTable[5]],
      ["7", yesterdayTable[6], todayTable[6], tomorrowTable[6]],
      ["8", yesterdayTable[7], todayTable[7], tomorrowTable[7]],
      ["9", yesterdayTable[8], todayTable[8], tomorrowTable[8]],
      ["10", yesterdayTable[9], todayTable[9], tomorrowTable[9]]
    ],
    {
      hasBorder: true,
      contentHasMarkup: false,
      borderChars: "lightRounded",
      borderAttr: {color: "white"},
      fit: false
    }
  )
}

async function yesOrNoPromise() {
  const promise = new Promise((resolve, reject) => {
    term.yesOrNo({yes: ["y", "c", "ENTER"], no: ["n", "q"]}, (err, result) => {
      resolve(result);
    })
  });
  return promise;
}

function getName(obj) {
  if(!obj) return "!";
  if(obj.firstname) {
    return obj.firstname + " " + obj.lastname;
  }
  if(obj.userString) {
    return obj.userString;
  }
  if(obj.name) {
    return obj.name;
  }
  return "?";
}

async function messages() {
  spinner = ora("Fetching messages");
  const msgs = [];
  const timeline = edupage.timeline;
  for(let i = 0; i < timeline.length; i++) {
    let msg = timeline[i];
    msgs.push([msg.title, msg.text, getName(msg.owner) + " -> " + (msg.recipient != null ? getName(msg.recipient) : msg.recipientUserString)]);
  }
  spinner.succeed("Done! Continue reading messages with y/c/ENTER and exit out of message mode with n/q");
  for(const msg of msgs) {
    term.table([["Title", "Message", "From -> To"], msg],
      {
        hasBorder: true,
        contentHasMarkup: false,
        borderChars: "lightRounded",
        borderAttr: {color: "white"},
        fit: true
      }
    )
    if(!await yesOrNoPromise()) {
      term.clear();
      break;
    }
  }
}

async function assignments() {
  spinner = ora("Fetching assignments");
  const assignments = [];
  for(let i = 0; i < edupage.assignments.length; i++) {
    const assignment = edupage.assignments[i];
    if(!assignment.isFinished) {
      assignments.push([assignment.subject.name, assignment.title, assignment.type])
    }
  }
  spinner.succeed("Done! Continue reading assignments with y/c/ENTER and exit out of assignment mode with n/q");
  for(const assignment of assignments) {
    term.table([["Subject", "Title", "Type"], assignment],
      {
        hasBorder: true,
        contentHasMarkup: false,
        borderChars: "lightRounded",
        borderAttr: {color: "white"},
        fit: false
      }
    )
    if(!await yesOrNoPromise()) {
      term.clear();
      break;
    }
  }
}

async function menu() {
  const promise = new Promise((resolve, reject) => {
    term.singleLineMenu(menuItems, menuOptions, (err, resp) => {
      resolve(resp);
    })
  });
  return promise;
}

spinner = ora("Logging in").start();

edupage.login(credentials.username, credentials.password).then(async user => {
  spinner.succeed("Logged in");
  
  term.clear();

  while(true) {
    const resp = await menu();
    term("\n");
    if(resp.selectedText === "Exit") {
      term.clear();
      process.exit(0);
    } else if(resp.selectedText === "Timetable") {
      await timetable();
    } else if(resp.selectedText === "Messages") {
      term.clear();
      await messages();
    } else if(resp.selectedText === "Assignments") {
      term.clear();
      await assignments();
    }
  }

}).catch(err => {
  spinner.fail("Error!!");
  console.error(err);
  process.exit(1);
});
