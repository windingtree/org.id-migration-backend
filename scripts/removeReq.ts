import { requests } from './connection';

const did = process.argv.slice(2)[0];

const main = async (did: string) => {
  await requests.del(did);

  console.log(`Request for DID: ${did} has been deleted`);
  process.exit(0);
};

main(did).catch((error) => {
  console.log(error);
  process.exit(1);
});
