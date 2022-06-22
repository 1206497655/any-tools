module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended'
    ],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
        createDefaultProgram: true,
    },
    rules: {

    }
}