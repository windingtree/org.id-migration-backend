import { resolve } from 'path';
import { utils, Wallet } from 'ethers';
import dotenv from 'dotenv';
const envFilePath = resolve(process.cwd(), '.env');
dotenv.config({ path: envFilePath });

// Generate random mnemonic (24 words)
export const generateMnemonic = () =>
  utils.entropyToMnemonic(utils.randomBytes(32));

// Extracts account list from the wallet by mnemonic
export const accountsListFromMnemonic = (
  mnemonic: string,
  count = 10
): string[] => {
  const hdNode = utils.HDNode.fromMnemonic(mnemonic);

  return Array(count)
    .fill(0)
    .map((_, index) => hdNode.derivePath(`m/44'/60'/0'/0/${index}`))
    .map((n) => n.address);
};

export const main = async (): Promise<void> => {
  const mnemonic = generateMnemonic();
  console.log('Mnemonic:', mnemonic);
  const wallet = Wallet.fromMnemonic(mnemonic as string);
  console.log('Account address:', wallet.address);
  console.log('PK:', wallet.privateKey);

  // const wallet = Wallet.fromMnemonic(process.env.MIGRATOR_MNEMONIC as string);
  // console.log('Account address:', wallet.address);
};

main().catch(console.log);
