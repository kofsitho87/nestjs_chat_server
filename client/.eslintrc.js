module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: 'babel-eslint'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    "no-unused-vars": "off",
    "no-useless-catch": "off",
    // "indent": [
    //   "error",
    //   2
    // ],
    // "linebreak-style": [
    //   "error",
    //   "unix"
    // ],
    // "quotes": [
    //   "error",
    //   "double"
    // ],
    // "semi": [
    //   "error",
    //   "never"
    // ],
  }
}
