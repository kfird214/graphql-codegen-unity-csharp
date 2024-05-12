import type { Config } from "jest";

// process.env.TEST_ENV = 'dev';

const config: Config = {
    verbose: true,
    preset: "ts-jest",
    testEnvironment: "node",
};

export default config;
