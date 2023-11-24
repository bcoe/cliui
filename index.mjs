// Bootstrap cliui with CommonJS dependencies:
import { cliui } from './build/lib/index.js'
import wrap from 'wrap-ansi'
import stripAnsi from 'strip-ansi'
import stringWidth from 'string-width'

export default function ui (opts) {
  return cliui(opts, {
    stringWidth,
    stripAnsi,
    wrap
  })
}
