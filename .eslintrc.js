module.exports = {
  'extends': 'google',
  'env': {
    // browser グローバル変数を使用する
    'browser': true,
  },
  "parserOptions": {
    "ecmaVersion": 6
  },
  'rules': {
    // インデントスタイルは2スペースに強制
    'indent': ['error', 2],
    // 改行コードはunix
    'linebreak-style': ['error', 'unix'],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ]
  }
};