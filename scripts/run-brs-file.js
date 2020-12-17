#!/usr/bin/env node


const readline = require("readline");
const fs = require("fs");
const vlog = require("./vlog");
program = require('commander');

program
  .option('-i, --input [filename]', 'Set input filename')
  .option('-p, --puzzle [puzzlename]', 'choose what puzzle to load (e.g. 1-1, or 13-2)')
  .option('-v, --verbose', 'Verbose mode on')
  .option('-a, --argument [arg]', 'Extra argument specific to Puzzle')
  .option('-t, --timing', 'Display execution time')
  .parse(process.argv);



if (!program.input && !program.argument) {
  console.error("Input file or argument is required");
  process.exit();
}

if (!program.puzzle) {
  console.error("Puzzle number is required");
  process.exit();
}

if (program.input) {
  vlog(`Using input file ${program.input}`);
}
if (program.argument) {
  vlog(`Using argument ${program.argument}`);
}


let currentLineNumber = 0;

const lines = [];

function startTiming() {
  return process.hrtime()
}
function endTiming(hrStart) {
  const hrEnd = process.hrtime(hrStart);
  const seconds = hrEnd[0];
  const ms = Math.round(hrEnd[1] / 10000) / 100;
  if (program.verbose || program.timing) {
    console.log(`Execution Time: ${seconds}s ${ms}ms`);
  }

}

function parseInput(line) {
  line = line.trim()
  currentLineNumber++;
  try {
    vlog(line);
    lines.push(line);
  } catch (e) {
    console.log(`Error parsing input line ${currentLineNumber} (${line}): ${e}`);
    process.exit();
  }
}


function createInputBrs() {
  const data = {
    input: lines,
    argument: program.argument,
    verbose: program.verbose
  };

  const brsData = JSON.stringify(data).replace(/null/g, "invalid");
  const inputFileText = `
function getData() as object
  return ${brsData}
end function`;


  fs.writeFileSync("./dist/source/input.brs", inputFileText);
  vlog(`Wrote input file ./dist/source/input`, inputFileText);
}




function runPuzzle(hasInput) {

  const files = ["./dist/source/bslib.brs", "./dist/source/utils.brs"]
  if (hasInput) {
    files.push("./dist/source/input.brs")
  }
  const dayPrefix = program.puzzle.split("-")[0]
  const dayUtilFile = `./dist/source/${dayPrefix}.util.brs`
  if (fs.existsSync(dayUtilFile)) {
    files.push(dayUtilFile)
  }
  const dayUtilFileNoDot = `./dist/source/${dayPrefix}_util.brs`
  if (fs.existsSync(dayUtilFileNoDot)) {
    files.push(dayUtilFileNoDot)
  }
  files.push(`./dist/source/${program.puzzle}.brs`)

  const brsCommandLine = `./node_modules/.bin/brs ` + files.join(" ");
  const startTime = startTiming();
  try {
    require('child_process').execSync(
      brsCommandLine,
      { stdio: 'inherit' }
    );
  } catch (e) {
    endTiming(startTime);
    console.log(`Error running puzzle solution: ${e}`);
    process.exit();
  }
  endTiming(startTime);
}

if (program.input) {
  const rl = readline.createInterface({
    input: fs.createReadStream(program.input)
  });

  rl.on("line", line => parseInput(line));

  rl.on("close", () => {
    createInputBrs();
    runPuzzle(true)
  });
}
else {
  runPuzzle(false);
}