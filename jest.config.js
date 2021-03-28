module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts'],
  testPathIgnorePatterns: ['/build/', '/node_modules/'],
};
