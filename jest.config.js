module.exports = {
    transform: {
      "^.+\\.jsx?$": "babel-jest"
    },
    moduleNameMapper: {
      '^.+\\.(css|less)$': '<rootDir>/testutils/css-stub.js'
    }
  };