module.exports = {
  "root": true,
  "env": {
    "node": true,
    "es6": true,
    "mocha": true
  },
  "parserOptions": {
    ecmaVersion: 8
  },
  "globals": {},
  "plugins": [],
  "extends": ["eslint:recommended"],
  "rules": {
    // Possible Errors
    "comma-dangle": [
      2
    ],
    "no-cond-assign": 2,
    "no-console": 1,
    "no-constant-condition": 2,
    "no-control-regex": 2,
    "no-debugger": 2,
    "no-dupe-keys": 2,
    "no-empty": 2,
    "no-empty-character-class": 2,
    "no-ex-assign": 2,
    "no-extra-boolean-cast": 2,
    "no-extra-parens": [
      2,
      "functions"
    ],
    "no-extra-semi": 2,
    "no-func-assign": 2,
    "no-inner-declarations": 2,
    "no-invalid-regexp": 2,
    "no-irregular-whitespace": 2,
    "no-negated-in-lhs": 2,
    "no-obj-calls": 2,
    "no-regex-spaces": 2,
    "no-reserved-keys": 0,
    "no-sparse-arrays": 2,
    "no-unreachable": 2,
    "use-isnan": 2,
    "valid-jsdoc": 0,
    "valid-typeof": 2,
    // Best Practices
    "block-scoped-var": 2,
    "complexity": 1,
    "consistent-return": 0,
    "curly": 2,
    "default-case": 2,
    "dot-notation": 2,
    "eqeqeq": 2,
    "guard-for-in": 2,
    "no-alert": 2,
    "no-caller": 2,
    "no-div-regex": 2,
    "no-else-return": 2,
    "no-eq-null": 2,
    "no-eval": 2,
    "no-extend-native": 2,
    "no-extra-bind": 2,
    "no-fallthrough": 2,
    "no-floating-decimal": 2,
    "no-implied-eval": 2,
    "no-iterator": 2,
    "no-labels": 2,
    "no-lone-blocks": 2,
    "no-loop-func": 2,
    "no-multi-spaces": 2,
    "no-multi-str": 0,
    "no-native-reassign": 2,
    "no-new": 2,
    "no-new-func": 2,
    "no-new-wrappers": 2,
    "no-octal": 2,
    "no-octal-escape": 2,
    "no-process-env": 0,
    "no-proto": 2,
    "no-redeclare": 2,
    "no-return-assign": 1,
    "no-script-url": 2,
    "no-self-compare": 2,
    "no-sequences": 2,
    "no-unused-expressions": 2,
    "no-void": 0,
    "no-warning-comments": 0,
    "no-with": 2,
    "radix": 2,
    "vars-on-top": 0,
    "wrap-iife": 2,
    "yoda": 2,
    // Strict Mode
    "strict": [
      2,
      "global"
    ],
    // Variables
    "no-catch-shadow": 2,
    "no-delete-var": 2,
    "no-label-var": 2,
    "no-shadow": 2,
    "no-shadow-restricted-names": 2,
    "no-undef": 2,
    "no-undef-init": 2,
    "no-undefined": 2,
    "no-unused-vars": 2,
    "no-use-before-define": 0,
    // Stylistic Issues
    "indent": ["error", 2, {
      "SwitchCase": 1,
       "MemberExpression": "off"
     }
    ],
    "brace-style": [
      2,
      "stroustrup"
    ],
    "camelcase": 0,
    "comma-spacing": 2,
    "comma-style": 2,
    "consistent-this": 0,
    "eol-last": 2,
    "func-names": 0,
    "func-style": 0,
    "key-spacing": [
      2,
      {
        "beforeColon": false,
        "afterColon": true
      }
    ],
    "max-nested-callbacks": 0,
    "new-cap": 0,
    "new-parens": 2,
    "no-array-constructor": 2,
    "no-inline-comments": 0,
    "no-lonely-if": 2,
    "no-mixed-spaces-and-tabs": 2,
    "no-nested-ternary": 2,
    "no-new-object": 2,
    "semi-spacing": [
      2,
      {
        "before": false,
        "after": true
      }
    ],
    "no-spaced-func": 2,
    "no-ternary": 0,
    "no-trailing-spaces": 2,
    "no-multiple-empty-lines": 2,
    "no-underscore-dangle": 0,
    "one-var": 0,
    "operator-assignment": [
      2,
      "always"
    ],
    "padded-blocks": 0,
    "quotes": [
      2,
      "single"
    ],
    "quote-props": [
      2,
      "as-needed"
    ],
    "semi": [
      2,
      "always"
    ],
    "sort-vars": [
      0,
      {
        "ignoreCase": true
      }
    ],

    "require-yield" : 1,
    "keyword-spacing": 2,
    "space-before-blocks": 2,
    "object-curly-spacing": 2,
    "array-bracket-spacing": 2,
    "computed-property-spacing": 2,
    "space-in-parens": 2,
    "space-infix-ops": 0,
    "space-unary-ops": 2,
    "spaced-comment": 2,
    "wrap-regex": 0,
    // Legacy
    "max-depth": 0,
    "max-len": [
      2,
      180
    ],
    "max-params": 0,
    "max-statements": 0,
    "no-plusplus": 0
  }
};
