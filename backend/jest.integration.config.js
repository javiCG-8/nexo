/** Pruebas de integración contra PostgreSQL real (ver tests-integration/setup-env.ts). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests-integration/**/*.int.spec.ts'],
  setupFiles: ['<rootDir>/tests-integration/setup-env.ts'],
  testTimeout: 20000
};
