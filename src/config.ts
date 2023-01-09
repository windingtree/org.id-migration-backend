import { resolve } from 'path';
import dotenv from 'dotenv';
import YAML from 'yamljs';
import { RedisOptions } from 'ioredis';

export interface ChainConfig {
  name: string;
  chainId: string;
  orgIdAddress: string;
  providerUri: string;
}

const envFilePath = resolve(process.cwd(), '.env');
dotenv.config({ path: envFilePath });

export const checkEnvVariables = (vars: string[]): void =>
  vars.forEach((variable) => {
    if (!process.env[variable] || process.env[variable] === '') {
      throw new Error(`${variable} must be provided in the .env`);
    }
  });

checkEnvVariables([
  'APP_PORT',
  'APP_NAME',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_USERNAME',
  'REDIS_PASSWORD',
  'SRC_CONTRACT',
  'SRC_PROVIDER',
  'W3S_KEY',
  'MIGRATOR_MNEMONIC',
  'VALIDATOR_URI',
]);

export const NODE_ENV = process.env.NODE_ENV || '';

export const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

export const PORT = process.env.APP_PORT;

export const APP_NAME = process.env.APP_NAME;

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split('|')
  : ['*'];

export const CHAINS: ChainConfig[] = [
  {
    name: 'Gnosis Chain',
    chainId: '100',
    orgIdAddress: '0xb63d48e9d1e51305a17F4d95aCa3637BBC181b44',
    providerUri:
      'https://poa-xdai.gateway.pokt.network/v1/lb/0b1afa3b501711635aee21f6',
  },
  {
    name: 'Polygon',
    chainId: '137',
    orgIdAddress: '0x8a093Cb94663994d19a778c7EA9161352a434c64',
    providerUri:
      'https://poly-mainnet.gateway.pokt.network/v1/lb/0b1afa3b501711635aee21f6',
  },
  {
    name: 'Goerli',
    chainId: '5',
    orgIdAddress: '0xe02dF24d8dFdd37B21690DB30F4813cf6c4D9D93',
    providerUri:
      'https://eth-goerli.g.alchemy.com/v2/aw5WyUmvvU_Uf4fI8nDj51Nx0QeUJ0lr',
  },
  {
    name: 'Chiado',
    chainId: '10200',
    orgIdAddress: '0xaa727223949Bf082a8AFcb29B34B358d9bad8736',
    providerUri: 'https://rpc.chiadochain.net',
  },
];

export const ALLOWED_CHAINS = CHAINS.map((c) => Number(c.chainId));

export const getChainById = (chainId: number | string): ChainConfig => {
  const chain = CHAINS.find((c) => c.chainId === String(chainId));
  if (!chain) {
    throw new Error(`Unknown chainId: ${chainId}`);
  }
  return chain;
};

export const REDIS_OPTIONS: RedisOptions = {
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT || 6379),
};

export const SRC_CONTRACT = process.env.SRC_CONTRACT || '';
export const SRC_PROVIDER = process.env.SRC_PROVIDER || '';

export const SWAGGER_DOC = YAML.load(
  resolve(process.cwd(), 'src/swagger.yaml')
);

export const W3S_KEY = process.env.W3S_KEY || '';

export const MNEMONIC = process.env.MIGRATOR_MNEMONIC;

export const VALIDATOR_URI = process.env.VALIDATOR_URI || '';
