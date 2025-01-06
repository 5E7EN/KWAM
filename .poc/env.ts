import * as dotenv from 'dotenv';
const configEnv = () => dotenv.config();

configEnv();

interface EnvInterface {
    DEBUG: boolean;
    IGNORE_SELF_MESSAGES: boolean;
}

export const ENV: EnvInterface = {
    DEBUG: process.env.DEBUG === 'True',
    IGNORE_SELF_MESSAGES: process.env.IGNORE_SELF_MESSAGES === 'True'
};
