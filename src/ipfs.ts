import {
  Web3Storage,
  Filelike,
  File,
  Blob,
  getFilesFromPath,
} from 'web3.storage';
import { W3S_KEY } from './config';

export interface IpfsApiAddResponse {
  Name: string;
  Hash: string;
  Size: string;
}

const makeFileObject = (obj: unknown, name: string): File[] => {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  return [new File([blob], name)];
};

const createWeb3StorageClient = (): Web3Storage => {
  return new Web3Storage({ token: W3S_KEY });
};

export const addJsonToIpfs = async (
  obj: unknown,
  name: string
): Promise<string> => {
  const client = createWeb3StorageClient();
  const files = makeFileObject(obj, name);
  const cid = await client.put(files as Iterable<Filelike>, {
    wrapWithDirectory: false,
  });
  return cid;
};

export const addFilesToIpfs = async (path: string): Promise<string> => {
  const client = createWeb3StorageClient();
  const files = await getFilesFromPath([path]);
  const cid = await client.put(files as Iterable<Filelike>, {
    wrapWithDirectory: false,
  });
  return cid;
};
