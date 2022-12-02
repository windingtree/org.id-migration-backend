import { providers, Contract } from 'ethers';

const org = process.argv.slice(2)[0];

export const destOrgIdAbi = [
  'function getTokenId(bytes32) public view returns (uint256 tokenId)',
  'function getOrgId(uint256) external view returns (bool exists,bytes32 orgId,string orgJsonUri,address owner)',
];

export const getDstContract = (): Contract => {
  const provider = new providers.JsonRpcProvider('https://sokol.poa.network');
  const contract = new Contract(
    '0xDd1231c0FD9083DA42eDd2BD4f041d0a54EF7BeE',
    destOrgIdAbi,
    provider
  );
  return contract;
};

const main = async (org: string): Promise<void> => {
  const dstContract = getDstContract();
  const tokenId = await dstContract.getTokenId(org);
  console.log('TokenId:', tokenId.toNumber());
  const orgId = await dstContract.getOrgId(tokenId);
  console.log('ORGiD:', orgId);
};

main(org).catch(console.log);
