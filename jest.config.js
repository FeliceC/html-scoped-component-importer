module.exports = {
  preset: "jest-puppeteer",
  globals: {
    PATH: "http://localhost:3003/"
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/test/bundlers/"
  ],
  testMatch: [
    "**/test/**/*.test.js"
  ]
}