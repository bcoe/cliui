'use strict'

/* global describe, it */

require('chai').should()

// Force chalk to enable color, if it's disabled the test fails.
process.env.FORCE_COLOR = 1

const chalk = require('chalk')
const cliui = require('../build/index.cjs')
const stripAnsi = require('strip-ansi-cjs')

describe('cliui', () => {
  describe('resetOutput', () => {
    it('should set lines to empty', () => {
      const ui = cliui()
      ui.div('i am a value that would be in a line')
      ui.resetOutput()
      ui.toString().length.should.be.equal(0)
    })
  })

  describe('div', () => {
    it("wraps text at 'width' if a single column is given", () => {
      const ui = cliui({
        width: 10
      })

      ui.div('i am a string that should be wrapped')

      ui.toString().split('\n').forEach(row => {
        row.length.should.be.lte(10)
      })
    })

    it('evenly divides text across columns if multiple columns are given', () => {
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
      ui.toString().split('\n').forEach(row => {
        row.length.should.be.lte(40)
      })

      // it should wrap each column appropriately.
      const expected = [
        'i am a string  i am a      i am a third',
        'that should be second      string that',
        'wrapped        string that should be',
        '               should be   wrapped',
        '               wrapped'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('allows for a blank row to be appended', () => {
      const ui = cliui({
        width: 40
      })

      ui.div()

      // it should wrap each column appropriately.
      const expected = ['']

      ui.toString().split('\n').should.eql(expected)
    })
  })

  describe('_columnWidths', () => {
    it('uses same width for each column by default', () => {
      const ui = cliui({
        width: 40
      })
      const widths = ui.columnWidths([{}, {}, {}])

      widths[0].should.equal(13)
      widths[1].should.equal(13)
      widths[2].should.equal(13)
    })

    it('divides width over remaining columns if first column has width specified', () => {
      const ui = cliui({
        width: 40
      })
      const widths = ui.columnWidths([{ width: 20 }, {}, {}])

      widths[0].should.equal(20)
      widths[1].should.equal(10)
      widths[2].should.equal(10)
    })

    it('divides width over remaining columns if middle column has width specified', () => {
      const ui = cliui({
        width: 40
      })
      const widths = ui.columnWidths([{}, { width: 10 }, {}])

      widths[0].should.equal(15)
      widths[1].should.equal(10)
      widths[2].should.equal(15)
    })

    it('keeps track of remaining width if multiple columns have width specified', () => {
      const ui = cliui({
        width: 40
      })
      const widths = ui.columnWidths([{ width: 20 }, { width: 12 }, {}])

      widths[0].should.equal(20)
      widths[1].should.equal(12)
      widths[2].should.equal(8)
    })

    it('uses a sane default if impossible widths are specified', () => {
      const ui = cliui({
        width: 40
      })
      const widths = ui.columnWidths([{ width: 30 }, { width: 30 }, { padding: [0, 2, 0, 1] }])

      widths[0].should.equal(30)
      widths[1].should.equal(30)
      widths[2].should.equal(4)
    })
  })

  describe('alignment', () => {
    it('allows a column to be right aligned', () => {
      const ui = cliui({
        width: 40
      })

      ui.div(
        'i am a string',
        { text: 'i am a second string', align: 'right' },
        'i am a third string that should be wrapped'
      )

      // it should right-align the second column.
      const expected = [
        'i am a stringi am a secondi am a third',
        '                    stringstring that',
        '                          should be',
        '                          wrapped'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('allows a column to be center aligned', () => {
      const ui = cliui({
        width: 60
      })

      ui.div(
        'i am a string',
        { text: 'i am a second string', align: 'center', padding: [0, 2, 0, 2] },
        'i am a third string that should be wrapped'
      )

      // it should right-align the second column.
      const expected = [
        'i am a string          i am a second       i am a third string',
        '                           string          that should be',
        '                                           wrapped'
      ]

      ui.toString().split('\n').should.eql(expected)
    })
  })

  describe('padding', () => {
    it('handles left/right padding', () => {
      const ui = cliui({
        width: 40
      })

      ui.div(
        { text: 'i have padding on my left', padding: [0, 0, 0, 4] },
        { text: 'i have padding on my right', padding: [0, 2, 0, 0], align: 'center' },
        { text: 'i have no padding', padding: [0, 0, 0, 0] }
      )

      // it should add left/right padding to columns.
      const expected = [
        '    i have     i have      i have no',
        '    padding  padding on    padding',
        '    on my     my right',
        '    left'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('handles top/bottom padding', () => {
      const ui = cliui({
        width: 40
      })

      ui.div(
        'i am a string',
        { text: 'i am a second string', padding: [2, 0, 0, 0] },
        { text: 'i am a third string that should be wrapped', padding: [0, 0, 1, 0] }
      )

      // it should add top/bottom padding to second
      // and third columns.
      const expected = [
        'i am a string             i am a third',
        '                          string that',
        '             i am a secondshould be',
        '             string       wrapped',
        ''
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('preserves leading whitespace as padding', () => {
      const ui = cliui()

      ui.div('     LEADING WHITESPACE')
      ui.div('\u001b[34m     with ansi\u001b[39m')

      const expected = [
        '     LEADING WHITESPACE',
        '     with ansi'
      ]

      ui.toString().split('\n').map(l => stripAnsi(l)).should.eql(expected)
    })
  })

  describe('border', () => {
    it('allows a border to be placed around a div', () => {
      const ui = cliui({
        width: 40
      })

      ui.div(
        { text: 'i am a first string', padding: [0, 0, 0, 0], border: true },
        { text: 'i am a second string', padding: [1, 0, 0, 0], border: true }
      )

      const expected = [
        '.------------------.',
        '| i am a first     |.------------------.',
        '| string           || i am a second    |',
        "'------------------'| string           |",
        "                    '------------------'"
      ]

      ui.toString().split('\n').should.eql(expected)
    })
  })

  describe('wrap', () => {
    it('allows wordwrap to be disabled', () => {
      const ui = cliui({
        wrap: false
      })

      ui.div(
        { text: 'i am a string', padding: [0, 1, 0, 0] },
        { text: 'i am a second string', padding: [0, 2, 0, 0] },
        { text: 'i am a third string that should not be wrapped', padding: [0, 0, 0, 2] }
      )

      ui.toString().should.equal('i am a string i am a second string    i am a third string that should not be wrapped')
    })
  })

  describe('span', () => {
    it('appends the next row to the end of the prior row if it fits', () => {
      const ui = cliui({
        width: 40
      })

      ui.span(
        { text: 'i am a string that will be wrapped', width: 30 }
      )

      ui.div(
        { text: ' [required] [default: 99]', align: 'right' }
      )

      const expected = [
        'i am a string that will be',
        'wrapped         [required] [default: 99]'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('does not append the string if it does not fit on the prior row', () => {
      const ui = cliui({
        width: 40
      })

      ui.span(
        { text: 'i am a string that will be wrapped', width: 30 }
      )

      ui.div(
        { text: 'i am a second row', align: 'left' }
      )

      const expected = [
        'i am a string that will be',
        'wrapped',
        'i am a second row'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('always appends text to prior span if wrap is disabled', () => {
      const ui = cliui({
        wrap: false,
        width: 40
      })

      ui.span(
        { text: 'i am a string that will be wrapped', width: 30 }
      )

      ui.div(
        { text: 'i am a second row', align: 'left', padding: [0, 0, 0, 3] }
      )

      ui.div('a third line')

      const expected = [
        'i am a string that will be wrapped   i am a second row',
        'a third line'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('appends to prior line appropriately when strings contain ansi escape codes', () => {
      const ui = cliui({
        width: 40
      })

      ui.span(
        { text: chalk.green('i am a string that will be wrapped'), width: 30 }
      )

      ui.div(
        { text: chalk.blue(' [required] [default: 99]'), align: 'right' }
      )

      const expected = [
        'i am a string that will be',
        'wrapped         [required] [default: 99]'
      ]

      ui.toString().split('\n').map(l => stripAnsi(l)).should.eql(expected)
    })
  })

  describe('layoutDSL', () => {
    it('turns tab into multiple columns', () => {
      const ui = cliui({
        width: 60
      })

      ui.div(
        '  <regex>  \tmy awesome regex\n  <my second thing>  \tanother row\t  a third column'
      )

      const expected = [
        '  <regex>            my awesome regex',
        '  <my second thing>  another row          a third column'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('turns newline into multiple rows', () => {
      const ui = cliui({
        width: 40
      })

      ui.div(
        'Usage: $0\n  <regex>\t  my awesome regex\n  <glob>\t  my awesome glob\t  [required]'
      )
      const expected = [
        'Usage: $0',
        '  <regex>  my awesome regex',
        '  <glob>   my awesome     [required]',
        '           glob'
      ]

      ui.toString().split('\n').should.eql(expected)
    })

    it('aligns rows appropriately when they contain ansi escape codes', () => {
      const ui = cliui({
        width: 40
      })

      ui.div(
        '  <regex>\t  ' + chalk.red('my awesome regex') + '\t  [regex]\n  ' + chalk.blue('<glob>') + '\t  my awesome glob\t  [required]'
      )

      const expected = [
        '  <regex>  my awesome     [regex]',
        '           regex',
        '  <glob>   my awesome     [required]',
        '           glob'
      ]

      ui.toString().split('\n').map(l => stripAnsi(l)).should.eql(expected)
    })

    it('ignores ansi escape codes when measuring padding', () => {
      // Forcefully enable color-codes for this test
      const { enabled, level } = chalk
      chalk.enabled = true
      chalk.level = 1

      const ui = cliui({
        width: 25
      })

      // using figlet font 'Shadow' rendering of text 'true' here
      ui.div(
        chalk.blue('  |                      \n  __|   __|  |   |   _ \\ \n  |    |     |   |   __/ \n \\__| _|    \\__,_| \\___| \n                         ')
      )

      // relevant part is first line - leading whitespace should be preserved as left padding
      const expected = [
        '  |',
        '  __|   __|  |   |   _ \\',
        '  |    |     |   |   __/',
        ' \\__| _|    \\__,_| \\___|',
        '                         '
      ]

      ui.toString().split('\n').map(l => stripAnsi(l)).should.eql(expected)
      chalk.enabled = enabled
      chalk.level = level
    })

    it('correctly handles lack of ansi escape codes when measuring padding', () => {
      const ui = cliui({
        width: 25
      })

      // using figlet font 'Shadow' rendering of text 'true' here
      ui.div(
        '  |                      \n  __|   __|  |   |   _ \\ \n  |    |     |   |   __/ \n \\__| _|    \\__,_| \\___| \n                         '
      )

      // The difference
      const expected = [
        '  |',
        '  __|   __|  |   |   _ \\',
        '  |    |     |   |   __/',
        ' \\__| _|    \\__,_| \\___|',
        ''
      ]

      ui.toString().split('\n').map(l => stripAnsi(l)).should.eql(expected)
    })

    it('does not apply DSL if wrap is false', () => {
      const ui = cliui({
        width: 40,
        wrap: false
      })

      ui.div(
        'Usage: $0\ttwo\tthree'
      )

      ui.toString().should.eql('Usage: $0\ttwo\tthree')
    })
  })
})
