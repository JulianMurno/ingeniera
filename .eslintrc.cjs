module.exports = {
  root: true,
  ignorePatterns: ['src/frontend/', 'dist/', 'node_modules/'],
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^next$' }],
  },
};
