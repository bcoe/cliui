/* global Deno */

// Bootstrap cliui with CommonJS dependencies:
import { cliui, UI } from './build/lib/index.js'
import type { UIOptions } from './build/lib/index.d.ts'
import { wrap, stripAnsi } from './build/lib/string-utils.js'

export default function ui (opts: UIOptions): UI {
  const optsWithWidth = opts ?? {}
  if (!optsWithWidth.width) {
    const { columns } = Deno.consoleSize()
    if (columns) {
      optsWithWidth.width = columns
    }
  }
  return cliui(optsWithWidth, {
    stringWidth: (str: string) => {
      return [...str].length
    },
    stripAnsi,
    wrap
  })
}
