module.exports = {
    transform: {
      "^.+\\.(t|j)sx?$": "babel-jest",
    },
    moduleNameMapper: {
      '^.+\\.(css|less)$': '<rootDir>/testutils/css-stub.js'
    }
  };