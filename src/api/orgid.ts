import { Level } from 'level';
import { utils } from 'ethers';
import { SRC_CONTRACT } from '../config';

export interface OrgId {
  orgId: string;
  orgIdNorm: string;
  orgJsonUri: string;
  parentOrgId: string;
  owner: string;
  isActive: boolean;
  orgJson: Record<string, unknown> | null;
}

export const source = new Level<string, OrgId>(`${SRC_CONTRACT}.level`, {
  valueEncoding: 'json',
});

// Returns a list of ORGiDs DIDs owned by address
export const getOwned = async (owner: string): Promise<string[]> =>
  (await source.values().all())
    .filter(
      (record) => utils.getAddress(record.owner) === utils.getAddress(owner)
    )
    .map((record) => `did:orgid:${record.orgId}`);
