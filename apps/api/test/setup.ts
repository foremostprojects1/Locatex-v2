/**
 * Baseline environment for every test file, applied before the file's imports run.
 *
 * Without this each test had to set variables by hand and then import the app dynamically,
 * because a static import pulls in the logger — and the logger reads validated config the
 * moment it loads. Setting placeholders here lets tests import normally; the harness
 * overrides MONGODB_URI once the in-memory server is up.
 */
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/locatex-test';
process.env.MONGODB_DB_NAME ??= 'locatex-test';
process.env.JWT_SECRET ??= 'test-secret-for-vitest-only-not-a-real-key';
process.env.APP_BASE_URL ??= 'http://localhost:5173';
process.env.API_BASE_URL ??= 'http://localhost:8080';
process.env.LOG_LEVEL ??= 'silent';

// Rate limits exist and are tested deliberately (see auth.rateLimit.test.ts); they must not
// trip while a suite makes dozens of legitimate calls from one address.
process.env.AUTH_RATE_LIMIT_MAX ??= '10000';
process.env.OTP_RATE_LIMIT_MAX ??= '10000';
