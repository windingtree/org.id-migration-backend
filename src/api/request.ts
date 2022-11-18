import { Queue, Job, Worker } from 'bullmq';
import { Level } from 'level';
import IORedis from 'ioredis';
import {
  verifyVC,
  SignedVC,
  parseBlockchainAccountId,
} from '@windingtree/org.id-auth/dist/vc';
import { parseDid } from '@windingtree/org.id-utils/dist/parsers';
import { MigrationRequest, RequestState, RequestStatus } from '../types';
import { ApiError } from '../errors';
import { REDIS_OPTIONS } from '../config';
import { getDstContract, validateBase } from './orgid';
import { addJsonToIpfs } from '../ipfs';

const queueName = 'migration';

const connection = new IORedis({
  ...REDIS_OPTIONS,
  maxRetriesPerRequest: null,
});

export const migrationQueue = new Queue(queueName, {
  connection,
});

export const requests = new Level<string, string>(`requests.level`);

export const clean = async (): Promise<void> => {
  await migrationQueue.obliterate();
  await requests.clear();
};

export const getState = async (job: Job): Promise<RequestState> => {
  switch (await job.getState()) {
    case 'completed':
      return RequestState.Completed;
    case 'unknown':
    case 'waiting':
    case 'waiting-children':
      return RequestState.Requested;
    case 'active':
    case 'delayed':
      return RequestState.Progress;
    case 'failed':
      return RequestState.Failed;
    default:
      throw new ApiError(500, 'Unknown job state');
  }
};

// Creates migration request job in queue
export const addJob = async (
  request: MigrationRequest
): Promise<RequestStatus> => {
  let jobId: string | undefined;

  try {
    // Check for request existence
    jobId = await requests.get(request.did);
  } catch {
    // It is OK
  }

  if (jobId) {
    throw new ApiError(403, 'Duplicated request');
  }

  await validateBase(request);

  const job = await migrationQueue.add('migrate', request);

  if (!job.id) {
    throw new ApiError(500, 'Request add failure');
  }

  await requests.put(request.did, job.id);

  const state = await getState(job);

  return {
    id: job.id,
    timestamp: job.timestamp,
    did: request.did,
    state,
  };
};

// Returns job status by Id
export const getJobStatus = async (id: string): Promise<RequestStatus> => {
  const job = await migrationQueue.getJob(id);

  if (!job || !job.id) {
    throw new ApiError(404, 'Not Found');
  }

  const state = await getState(job);

  return {
    id: job.id,
    timestamp: job.timestamp,
    did: job.data.did,
    state,
  };
};

// Returns a request job by DID
export const getRequestByDid = async (did: string): Promise<RequestStatus> => {
  try {
    const id = await requests.get(did);
    return await getJobStatus(id);
  } catch {
    throw new ApiError(404, 'Not Found');
  }
};

export const handleJobs = async (): Promise<void> => {
  try {
    const worker = new Worker(
      queueName,
      async (job: Job<MigrationRequest>): Promise<void> => {
        // console.log('Started job:', job);

        const vc = await validateBase(job.data);

        if (!vc.proof) {
          throw new ApiError(400, 'Invalid ORGiD VC: proof not found');
        }

        const verificationMethodId = vc.proof.verificationMethod;

        if (!verificationMethodId) {
          throw new ApiError(
            400,
            'Invalid ORGiD VC: verificationMethod Id not found'
          );
        }

        const verificationMethod =
          vc.credentialSubject.verificationMethod?.find(
            (v) => v.id === verificationMethodId
          );

        if (!verificationMethod || !verificationMethod.blockchainAccountId) {
          throw new ApiError(
            400,
            'Invalid ORGiD VC: Invalid verificationMethod'
          );
        }

        const { accountAddress: owner } = parseBlockchainAccountId(
          verificationMethod.blockchainAccountId
        );

        if (owner) {
          throw new ApiError(
            400,
            'Invalid ORGiD VC: Invalid blockchainAccountId of verificationMethod'
          );
        }

        await verifyVC(vc as SignedVC, verificationMethod.blockchainAccountId);

        // Send createOrgIdFor(bytes32,string,address,string[])
        const { network, orgId } = parseDid(vc.credentialSubject.id);
        const dstContract = getDstContract(network);
        const cid = addJsonToIpfs(vc, `${orgId}.json`);

        await dstContract.createOrgIdFor(orgId, `ipfs://${cid}`, owner, []);
      },
      {
        connection,
        autorun: true,
      }
    );

    worker.on('completed', (job: Job) => {
      // console.log('Completed job:', job);
    });

    worker.on('failed', (job: Job) => {
      // console.log('Failed job:', job);
    });
  } catch (error) {
    console.log(error);
  }
};
