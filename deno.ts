// Bootstrap cliui with CommonJS dependencies:
import { cliui, UI } from './build/lib/index.js'
import type { UIOptions } from './build/lib/index.d.ts'
import wrap from 'wrap-ansi'
import stripAnsi from 'strip-ansi'
import stringWidth from 'string-width'

export default function ui (opts: UIOptions): UI {
  return cliui(opts, {
    stringWidth,
    stripAnsi,
    wrap
  })
}
