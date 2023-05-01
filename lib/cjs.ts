// Bootstrap cliui with CommonJS dependencies:
import { cliui, UIOptions } from './index.js'
const stringWidth = require('string-width-cjs')
const stripAnsi = require('strip-ansi-cjs')
const wrap = require('wrap-ansi-cjs')
export default function ui (opts: UIOptions) {
  return cliui(opts, {
    stringWidth,
    stripAnsi,
    wrap
  })
}
