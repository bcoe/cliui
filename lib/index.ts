'use strict'

const align = {
  right: alignRight,
  center: alignCenter
}

const top = 0
const right = 1
const bottom = 2
const left = 3

export interface UIOptions {
  width: number;
  wrap?: boolean;
  rows?: string[];
}

interface Column {
  text: string;
  width?: number;
  align?: 'right'|'left'|'center',
  padding: number[],
  border?: boolean;
}

interface ColumnArray extends Array<Column> {
  span: boolean;
}

interface Line {
  hidden?: boolean;
  text: string;
  span?: boolean;
}

interface Mixin {
  stringWidth: Function;
  stripAnsi: Function;
  wrap: Function;
}

export class UI {
  width: number;
  wrap: boolean;
  rows: ColumnArray[];

  constructor (opts: UIOptions) {
    this.width = opts.width
    /* c8 ignore start */
    this.wrap = opts.wrap ?? true
    /* c8 ignore stop */
    this.rows = []
  }

  span (...args: ColumnArray) {
    const cols = this.div(...args)
    cols.span = true
  }

  resetOutput () {
    this.rows = []
  }

  div (...args: (Column|string)[]): ColumnArray {
    if (args.length === 0) {
      this.div('')
    }

    if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === 'string') {
      return this.applyLayoutDSL(args[0])
    }

    const cols = args.map(arg => {
      if (typeof arg === 'string') {
        return this.colFromString(arg)
      }
      return arg
    }) as ColumnArray

    this.rows.push(cols)
    return cols
  }

  private shouldApplyLayoutDSL (...args: (Column|string)[]): boolean {
    return args.length === 1 && typeof args[0] === 'string' &&
      /[\t\n]/.test(args[0])
  }

  private applyLayoutDSL (str: string): ColumnArray {
    const rows = str.split('\n').map(row => row.split('\t'))
    let leftColumnWidth = 0

    // simple heuristic for layout, make sure the
    // second column lines up along the left-hand.
    // don't allow the first column to take up more
    // than 50% of the screen.
    rows.forEach(columns => {
      if (columns.length > 1 && mixin.stringWidth(columns[0]) > leftColumnWidth) {
        leftColumnWidth = Math.min(
          Math.floor(this.width * 0.5),
          mixin.stringWidth(columns[0])
        )
      }
    })

    // generate a table:
    //  replacing ' ' with padding calculations.
    //  using the algorithmically generated width.
    rows.forEach(columns => {
      this.div(...columns.map((r, i) => {
        return {
          text: r.trim(),
          padding: this.measurePadding(r),
          width: (i === 0 && columns.length > 1) ? leftColumnWidth : undefined
        } as Column
      }))
    })

    return this.rows[this.rows.length - 1]
  }

  private colFromString (text: string): Column {
    return {
      text,
      padding: this.measurePadding(text)
    }
  }

  private measurePadding (str: string): number[] {
    // measure padding without ansi escape codes
    const noAnsi = mixin.stripAnsi(str)
    return [0, noAnsi.match(/\s*$/)[0].length, 0, noAnsi.match(/^\s*/)[0].length]
  }

  toString (): string {
    const lines: Line[] = []

    this.rows.forEach(row => {
      this.rowToString(row, lines)
    })

    // don't display any lines with the
    // hidden flag set.
    return lines
      .filter(line => !line.hidden)
      .map(line => line.text)
      .join('\n')
  }

  rowToString (row: ColumnArray, lines: Line[]) {
    this.rasterize(row).forEach((rrow, r) => {
      let str = ''
      rrow.forEach((col: string, c: number) => {
        const { width } = row[c] // the width with padding.
        const wrapWidth = this.negatePadding(row[c]) // the width without padding.

        let ts = col // temporary string used during alignment/padding.

        if (wrapWidth > mixin.stringWidth(col)) {
          ts += ' '.repeat(wrapWidth - mixin.stringWidth(col))
        }

        // align the string within its column.
        if (row[c].align && row[c].align !== 'left' && this.wrap) {
          const fn = align[(row[c].align as 'right'|'center')]
          ts = fn(ts, wrapWidth)
          if (mixin.stringWidth(ts) < wrapWidth) {
            /* c8 ignore start */
            const w = width || 0
            /* c8 ignore stop */
            ts += ' '.repeat(w - mixin.stringWidth(ts) - 1)
          }
        }

        // apply border and padding to string.
        const padding = row[c].padding || [0, 0, 0, 0]
        if (padding[left]) {
          str += ' '.repeat(padding[left])
        }

        str += addBorder(row[c], ts, '| ')
        str += ts
        str += addBorder(row[c], ts, ' |')
        if (padding[right]) {
          str += ' '.repeat(padding[right])
        }

        // if prior row is span, try to render the
        // current row on the prior line.
        if (r === 0 && lines.length > 0) {
          str = this.renderInline(str, lines[lines.length - 1])
        }
      })

      // remove trailing whitespace.
      lines.push({
        text: str.replace(/ +$/, ''),
        span: row.span
      })
    })

    return lines
  }

  // if the full 'source' can render in
  // the target line, do so.
  private renderInline (source: string, previousLine: Line) {
    const match = source.match(/^ */)
    /* c8 ignore start */
    const leadingWhitespace = match ? match[0].length : 0
    /* c8 ignore stop */
    const target = previousLine.text
    const targetTextWidth = mixin.stringWidth(target.trimEnd())

    if (!previousLine.span) {
      return source
    }

    // if we're not applying wrapping logic,
    // just always append to the span.
    if (!this.wrap) {
      previousLine.hidden = true
      return target + source
    }

    if (leadingWhitespace < targetTextWidth) {
      return source
    }

    previousLine.hidden = true

    return target.trimEnd() + ' '.repeat(leadingWhitespace - targetTextWidth) + source.trimStart()
  }

  private rasterize (row: ColumnArray) {
    const rrows: string[][] = []
    const widths = this.columnWidths(row)
    let wrapped: string[]

    // word wrap all columns, and create
    // a data-structure that is easy to rasterize.
    row.forEach((col, c) => {
      // leave room for left and right padding.
      col.width = widths[c]
      if (this.wrap) {
        wrapped = mixin.wrap(col.text, this.negatePadding(col), { hard: true }).split('\n')
      } else {
        wrapped = col.text.split('\n')
      }

      if (col.border) {
        wrapped.unshift('.' + '-'.repeat(this.negatePadding(col) + 2) + '.')
        wrapped.push("'" + '-'.repeat(this.negatePadding(col) + 2) + "'")
      }

      // add top and bottom padding.
      if (col.padding) {
        wrapped.unshift(...new Array(col.padding[top] || 0).fill(''))
        wrapped.push(...new Array(col.padding[bottom] || 0).fill(''))
      }

      wrapped.forEach((str: string, r: number) => {
        if (!rrows[r]) {
          rrows.push([])
        }

        const rrow = rrows[r]

        for (let i = 0; i < c; i++) {
          if (rrow[i] === undefined) {
            rrow.push('')
          }
        }

        rrow.push(str)
      })
    })

    return rrows
  }

  private negatePadding (col: Column) {
    /* c8 ignore start */
    let wrapWidth = col.width || 0
    /* c8 ignore stop */
    if (col.padding) {
      wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0)
    }

    if (col.border) {
      wrapWidth -= 4
    }

    return wrapWidth
  }

  private columnWidths (row: ColumnArray) {
    if (!this.wrap) {
      return row.map(col => {
        return col.width || mixin.stringWidth(col.text)
      })
    }

    let unset = row.length
    let remainingWidth = this.width

    // column widths can be set in config.
    const widths = row.map(col => {
      if (col.width) {
        unset--
        remainingWidth -= col.width
        return col.width
      }

      return undefined
    })

    // any unset widths should be calculated.
    /* c8 ignore start */
    const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0
    /* c8 ignore stop */

    return widths.map((w, i) => {
      if (w === undefined) {
        return Math.max(unsetWidth, _minWidth(row[i]))
      }

      return w
    })
  }
}

function addBorder (col: Column, ts: string, style: string) {
  if (col.border) {
    if (/[.']-+[.']/.test(ts)) {
      return ''
    }

    if (ts.trim().length !== 0) {
      return style
    }

    return '  '
  }

  return ''
}

// calculates the minimum width of
// a column, based on padding preferences.
function _minWidth (col: Column) {
  const padding = col.padding || []
  const minWidth = 1 + (padding[left] || 0) + (padding[right] || 0)
  if (col.border) {
    return minWidth + 4
  }

  return minWidth
}

function getWindowWidth (): number {
  /* c8 ignore start */
  if (typeof process === 'object' && process.stdout && process.stdout.columns) {
    return process.stdout.columns
  }
  return 80
}
/* c8 ignore stop */

function alignRight (str: string, width: number): string {
  str = str.trim()
  const strWidth = mixin.stringWidth(str)

  if (strWidth < width) {
    return ' '.repeat(width - strWidth) + str
  }

  return str
}

function alignCenter (str: string, width: number): string {
  str = str.trim()
  const strWidth = mixin.stringWidth(str)

  /* c8 ignore start */
  if (strWidth >= width) {
    return str
  }
  /* c8 ignore stop */

  return ' '.repeat((width - strWidth) >> 1) + str
}

let mixin: Mixin
export function cliui (opts: Partial<UIOptions>, _mixin: Mixin) {
  mixin = _mixin
  return new UI({
    /* c8 ignore start */
    width: opts?.width || getWindowWidth(),
    wrap: opts?.wrap
    /* c8 ignore stop */
  })
}
