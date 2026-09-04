export type NodeEnvironment = 'development' | 'test' | 'production';

export interface AppConfig {
  nodeEnv: NodeEnvironment;
  webPort: number;
  apiPort: number;
  databaseUrl: string;
  redisUrl: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function port(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port environment variable: ${name}`);
  }
  return parsed;
}

export function getAppConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnvironment;
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('Invalid NODE_ENV');
  }

  return {
    nodeEnv,
    webPort: port('WEB_PORT', 3000),
    apiPort: port('API_PORT', 4000),
    databaseUrl: required('DATABASE_URL'),
    redisUrl: required('REDIS_URL'),
  };
}
