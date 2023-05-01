'use strict'

/* global describe, it */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
require('chai').should()

const text = `usage: git tag [-a | -s | -u <key-id>] [-f] [-m <msg> | -F <file>] [-e]
               <tagname> [<commit> | <object>]
   or: git tag -d <tagname>...
   or: git tag [-n[<num>]] -l [--contains <commit>] [--no-contains <commit>]
               [--points-at <object>] [--column[=<options>] | --no-column]
               [--create-reflog] [--sort=<key>] [--format=<format>]
               [--merged <commit>] [--no-merged <commit>] [<pattern>...]
   or: git tag -v [--format=<format>] <tagname>...`


const cliuiCJS = require('../build/index.cjs')
import cliuiESM from '../index.mjs'
describe('consistent wrapping', () => {
  it('should produce matching output in cjs and esm', () => {
    const uiCJS = cliuiCJS({})
    const uiESM = cliuiESM({})
    uiCJS.div({
      padding: [0, 0, 0, 0],
      text,
    })
    uiESM.div({
      padding: [0, 0, 0, 0],
      text,
    })
    uiCJS.toString().should.equal(uiESM.toString())
  })
})
