import { Level } from 'level';
import { utils, providers, Contract } from 'ethers';
import { ORGJSONVCNFT } from '@windingtree/org.json-schema/types/orgVc';
import { parseDid } from '@windingtree/org.id-utils/dist/parsers';
import { MigrationRequest } from '../types';
import { ApiError } from '../errors';
import {
  SRC_CONTRACT,
  SRC_PROVIDER,
  ALLOWED_CHAINS,
  getChainById,
} from '../config';

export interface OrgId {
  orgId: string;
  orgIdNorm: string;
  orgJsonUri: string;
  parentOrgId: string;
  owner: string;
  isActive: boolean;
  orgJson: Record<string, unknown> | null;
}

export const sourceOrgIdAbi = [
  'function getOrganizations(bool) external view returns (bytes32[] memory)',
  'function getOrganization(bytes32) external view returns (bool exists,bytes32 orgId,bytes32 orgJsonHash,string memory orgJsonUri,string memory orgJsonUriBackup1,string memory orgJsonUriBackup2,bytes32 parentOrgId,address owner,address director,bool isActive,bool isDirectorshipAccepted)',
];

export const destOrgIdApi = [
  'function getTokenId(bytes32) public view returns (uint256 tokenId)',
  'function getOrgId(uint256) external view returns (bool exists,bytes32 orgId,string orgJsonUri,address owner)',
  'function createOrgIdFor(bytes32,string,address,string[]) external',
];

export const source = new Level<string, OrgId>(`${SRC_CONTRACT}.level`, {
  valueEncoding: 'json',
});

export const getSrcContract = (): Contract => {
  const provider = new providers.JsonRpcProvider(SRC_PROVIDER);
  return new Contract(SRC_CONTRACT, sourceOrgIdAbi, provider);
};

export const getDstContract = (chainId: number | string): Contract => {
  const chain = getChainById(chainId);
  const provider = new providers.JsonRpcProvider(chain.providerUri);
  return new Contract(chain.orgIdAddress, destOrgIdApi, provider);
};

// Returns a list of ORGiDs DIDs owned by address
export const getOwned = async (owner: string): Promise<string[]> =>
  (await source.values().all())
    .filter(
      (record) => utils.getAddress(record.owner) === utils.getAddress(owner)
    )
    .map((record) => `did:orgid:${record.orgId}`);

export const validateBase = async (
  request: MigrationRequest
): Promise<ORGJSONVCNFT> => {
  const srcContract = getSrcContract();
  const { orgId: requestedOrgId } = parseDid(request.did);
  const { exists: requestedExists } = await srcContract.getOrganization(
    requestedOrgId
  );

  if (!requestedExists) {
    throw new ApiError(400, 'Requested ORGiD not found in the source contract');
  }

  const vc = JSON.parse(request.orgIdVc) as ORGJSONVCNFT;

  const { network, orgId } = parseDid(vc.credentialSubject.id);

  if (orgId !== requestedOrgId) {
    throw new ApiError(400, 'ORGiD VC DID must be equal to requested DID');
  }

  if (request.chain !== Number(network)) {
    throw new ApiError(400, 'ORGiD VC chain must be equal to requested chain');
  }

  if (!ALLOWED_CHAINS.includes(Number(network))) {
    throw new ApiError(400, 'ORGiD VC DID chainId not allowed');
  }

  const dstContract = getDstContract(network);
  const tokenId = await dstContract.getTokenId(requestedOrgId);

  if (tokenId > 0) {
    throw new ApiError(400, 'Requested ORGiD has been already migrated');
  }

  return vc;
};
