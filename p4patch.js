#!/usr/bin/env node

const co = require("co");
const pmfy = require("pmfy");
const child_process = require("child_process");
const fs = require("fs");
const process = require("process");
const log = require("lawg");
const _ = require("lodash");
/**
 * Run in the local dir under p4v control, patch is generated for all files checked out under this
 * local dir.
 *
 */
OutFileName = "p4patch.txt";
const pm = {
  process : pmfy(process),
  child_process : pmfy(child_process)
}
const exec = pm.child_process.exec;

co(function*() {
  "use strict";

  const pwd = process.cwd();

  yield exec(`p4 diff -dcu ./... > ${OutFileName}`);

  // figure out new files
  let newFiles;
  {
    let nOverlap = 0;
    const [stdout] = yield exec(`p4 revert -n ./... | grep 'was add'`);
    newFiles = _(stdout.split("\n")).map(
      (l)=>l.split(/\s/)[0].replace(/\#none$/,'')
    ).filter().map(
      (depotFile)=>{
        let localFile = "";
        if (!nOverlap) {
          const lastLocalTok = pwd.split(/[\\\/]/).pop();
          nOverlap = depotFile.indexOf(`/${lastLocalTok}`) + lastLocalTok.length + 1;
        }
        localFile = pwd + depotFile.slice(nOverlap);
        return {
          depot: depotFile,
          local: localFile
        }
      }
    ).value();
  }
  const countline = (str)=>{
    let i = -1, n=0;
    while (true) {
      i = str.indexOf("\n");
      if (i!=-1) { str = str.slice(i+1); n++;}
      else break;
    }
    return n;
  }
  // append new files to patch
  for (let {depot, local} of newFiles) {
    //log(lf);
    let content = fs.readFileSync(local).toString();
    let nline = countline(content);
    content = _(content.split("\n")).map((l)=>'+'+l).join("\n");
    let patchStr = `
==== ${depot}#1 - ${local} ====
@@ -1,1 +1,${nline} @@
${content}
    `;
    fs.appendFileSync(OutFileName, patchStr);
  }


}).then(()=>{
  "use strict";
  console.log(OutFileName + " is generated");
}).catch((err)=>{
  console.error(err);
  process.exit(1);
});