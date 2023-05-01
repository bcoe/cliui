// Bootstrap cliui with ESM dependencies in Deno's style:
import { cliui, UI } from './build/lib/index.js'
import type { UIOptions } from './build/lib/index.d.ts'

import stringWidth from 'npm:string-width'
import stripAnsi from 'npm:strip-ansi'
import wrap from 'npm:wrap-ansi'

export default function ui (opts: UIOptions): UI {
  return cliui(opts, {
    stringWidth,
    stripAnsi,
    wrap
  })
}
