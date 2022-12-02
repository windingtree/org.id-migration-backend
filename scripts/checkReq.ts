import { requests } from './connection';

const did = process.argv.slice(2)[0];

const main = async (did: string) => {
  const request = await requests.get(did);

  if (!request) {
    throw new Error(`Request for DID: ${did} not found`);
  }

  console.log(request);
  process.exit(0);
};

main(did).catch((error) => {
  console.log(error);
  process.exit(1);
});
