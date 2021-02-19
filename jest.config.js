module.exports = {
  preset: "jest-puppeteer",
  globals: {
    PATH: "http://localhost:3003/"
  },
  testMatch: [
    "**/test/**/*.test.js"
  ]
}