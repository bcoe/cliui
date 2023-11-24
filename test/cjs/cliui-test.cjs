const { runTests } = require('../shared-tests.cjs')
const cliui = require('../../build/index.cjs')

runTests(cliui, 'CJS')
