#!/usr/bin/env node
const co = require('co')
const pmfy = require('pmfy')
const childProcess = require('child_process')
const fs = require('fs')
const _ = require('lodash')
/**
 * Run in the local dir under p4v control, patch is generated for all files checked out under this
 * local dir.
 *
 */
const pm = {
  process: pmfy(process),
  childProcess: pmfy(childProcess)
}
const exec = pm.childProcess.exec

co(function*() {
  'use strict'

  const pwd = process.cwd()

  let [diffstdout] = yield exec(`p4 diff -dcu ./...`)
  console.log(diffstdout)

  // figure out new files
  let newFiles
  {
    let nOverlap = 0
    const [stdout] = yield exec(`p4 revert -n ./...`)
    newFiles = _(stdout.split('\n'))
      .filter((l) => /was added/.test(l))
      .map((l) => l.split(/\s/)[0].replace(/#none$/, ''))
      .filter()
      .map((depotFile) => {
        let localFile
        if (!nOverlap) {
          const lastLocalTok = pwd.split(/[\\/]/).pop()
          nOverlap = depotFile.indexOf(`/${lastLocalTok}`) + lastLocalTok.length + 1
        }
        localFile = pwd + depotFile.slice(nOverlap)
        return {
          depot: depotFile,
          local: localFile
        }
      }
    ).value()
  }
  const countline = (str) => {
    let i, n = 0
    while (true) {
      i = str.indexOf('\n')
      if (i !== -1) { str = str.slice(i + 1); n++ } else break
    }
    return n
  }

  // append new files to patch
  for (let {depot, local} of newFiles) {
    let content = fs.readFileSync(local).toString()
    let nline = countline(content)
    content = _(content.split('\n')).map((l) => '+' + l).join('\n')
    let patchStr = `
==== ${depot}#1 - ${local} ====
@@ -1,1 +1,${nline} @@
${content}
    `
    console.log(patchStr)
  }
}).then(() => {
  'use strict'
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
