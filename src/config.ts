import { resolve } from 'path';
import dotenv from 'dotenv';
import YAML from 'yamljs';
import { ChainConfig } from './types';

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
  'DST_CONTRACTS',
]);

export const NODE_ENV = process.env.NODE_ENV || 'development';

export const PORT = process.env.APP_PORT;

export const APP_NAME = process.env.APP_NAME;

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split('|')
  : ['*'];

export const CHAINS: ChainConfig[] = [
  {
    name: 'Gnosis Chain',
    chainId: '100',
    blockchainType: 'eip155',
    orgIdAddress: '0xb63d48e9d1e51305a17F4d95aCa3637BBC181b44',
    providerUri:
      'https://poa-xdai.gateway.pokt.network/v1/lb/0b1afa3b501711635aee21f6',
  },
  {
    name: 'Polygon',
    chainId: '137',
    blockchainType: 'eip155',
    orgIdAddress: '0x8a093Cb94663994d19a778c7EA9161352a434c64',
    providerUri:
      'https://poly-mainnet.gateway.pokt.network/v1/lb/0b1afa3b501711635aee21f6',
  },
  {
    name: 'Goerli',
    chainId: '5',
    blockchainType: 'eip155',
    orgIdAddress: '0xe02dF24d8dFdd37B21690DB30F4813cf6c4D9D93',
    providerUri:
      'https://eth-goerli.g.alchemy.com/v2/aw5WyUmvvU_Uf4fI8nDj51Nx0QeUJ0lr',
  },
  {
    name: 'Sokol',
    chainId: '77',
    blockchainType: 'eip155',
    orgIdAddress: '0xDd1231c0FD9083DA42eDd2BD4f041d0a54EF7BeE',
    providerUri: 'https://sokol.poa.network',
  },
  {
    name: 'Columbus',
    chainId: '502',
    blockchainType: 'eip155',
    orgIdAddress: '0xd8b75be9a47ffab0b5c27a143b911af7a7bf4076',
    providerUri: 'https://columbus.camino.foundation/ext/bc/C/rpc',
  },
];

export const REDIS_URL = `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

export const SRC_CONTRACT = process.env.SRC_CONTRACT || '';

export const DST_CONTRACTS = (process.env.DST_CONTRACTS || '').split(',');

export const SWAGGER_DOC = YAML.load(
  resolve(process.cwd(), 'src/swagger.yaml')
);
