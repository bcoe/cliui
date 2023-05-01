/* global Deno */

import {
  assert,
  assertEquals
} from 'https://deno.land/std/testing/asserts.ts'
import cliui from '../../deno.ts'

Deno.test("wraps text at 'width' if a single column is given", () => {
  const ui = cliui({
    width: 10
  })

  ui.div('i am a string that should be wrapped')

  ui.toString().split('\n').forEach((row: string) => {
    assert(row.length <= 10)
  })
})

Deno.test('evenly divides text across columns if multiple columns are given', () => {
  const ui = cliui({
    width: 40
  })

  ui.div(
    { text: 'i am a string that should be wrapped', width: 15 },
    'i am a second string that should be wrapped',
    'i am a third string that should be wrapped'
  )

  // total width of all columns is <=
  // the width cliui is initialized with.
  ui.toString().split('\n').forEach((row: string) => {
    assert(row.length <= 40)
  })

  // it should wrap each column appropriately.
  const expected = [
    'i am a string  i am a      i am a third',
    'that should be second      string that',
    'wrapped        string that should be',
    '               should be   wrapped',
    '               wrapped'
  ]

  ui.toString().split('\n').forEach((line: string, i: number) => {
    assertEquals(line, expected[i])
  })
})
