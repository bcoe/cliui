import ts from 'rollup-plugin-ts'

const output = {
  format: 'esm',
  file: './build/index.mjs',
  exports: 'default'
}

if (process.env.NODE_ENV === 'test') output.sourcemap = true

export default {
  input: './lib/cjs.ts',
  output,
  plugins: [
    ts({ /* options */ })
  ]
}
