import { Job, Worker } from 'bullmq';
import {
  verifyVC,
  SignedVC,
  parseBlockchainAccountId,
} from '@windingtree/org.id-auth/dist/vc';
import { parseDid } from '@windingtree/org.id-utils/dist/parsers';
import { MigrationRequest, RequestState, RequestStatus } from '../types';
import { ApiError } from '../errors';
import { getDstContract, getOwner, validateBase } from './orgid';
import { addJsonToIpfs } from '../ipfs';
import { redisDb, requestKey, queueName, migrationQueue } from '../connection';
import Logger from '../logger';

const logger = Logger('request');

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
  const jobId = await redisDb.get(requestKey(request.did));

  if (jobId) {
    throw new ApiError(403, 'Duplicated request');
  }

  await validateBase(request);
  logger.debug(`Request for ${request.did} has been validated`);

  // now we have validate the signer
  const orgIdVc = JSON.parse(request.orgIdVc);
  const { orgId } = parseDid(request.did);
  const owner = await getOwner(orgId);
  await verifyVC(orgIdVc as SignedVC, `eip155:77:${owner}`);
  logger.debug(`ORGiD VC of ${request.did} has been validated`);

  const job = await migrationQueue.add('migrate', request);

  if (!job.id) {
    throw new ApiError(500, 'Request add failure');
  }
  logger.debug(`Request for ${request.did} has been added to the queue`);

  await redisDb.set(requestKey(request.did), job.id);

  const requestStatus = {
    id: job.id,
    timestamp: job.timestamp,
    did: request.did,
    newDid: orgIdVc.issuer,
    state: await getState(job),
  };
  logger.debug('requestState', requestStatus);

  return requestStatus;
};

// Returns job status by Id
export const getJobStatus = async (id: string): Promise<RequestStatus> => {
  const job = await migrationQueue.getJob(id);

  if (!job || !job.id) {
    throw new ApiError(404, 'Not Found');
  }

  const orgIdVc = JSON.parse(job.data.orgIdVc);

  const requestStatus = {
    id: job.id,
    timestamp: job.timestamp,
    did: job.data.did,
    newDid: orgIdVc.issuer,
    state: await getState(job),
  };
  logger.debug('requestState', requestStatus);

  return requestStatus;
};

// Returns a request job by DID
export const getRequestByDid = async (did: string): Promise<RequestStatus> => {
  const id = await redisDb.get(requestKey(did));
  if (!id) {
    throw new ApiError(404, 'Not Found');
  }
  return await getJobStatus(id);
};

export const handleJobs = async (): Promise<void> => {
  try {
    const worker = new Worker(
      queueName,
      async (job: Job<MigrationRequest>): Promise<void> => {
        try {
          logger.debug('Started job:', job.id);

          const vc = await validateBase(job.data);
          logger.debug('Vc structure validated');

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

          if (!owner) {
            throw new ApiError(
              400,
              'Invalid ORGiD VC: Invalid blockchainAccountId of verificationMethod'
            );
          }

          await verifyVC(
            vc as SignedVC,
            verificationMethod.blockchainAccountId
          );
          logger.debug(`ORGiD VC of ${job.data.did} has been validated`);

          // Send createOrgIdFor(bytes32,string,address,string[])
          const { network, orgId } = parseDid(vc.credentialSubject.id);
          const cid = await addJsonToIpfs(vc, `${orgId}.json`);
          logger.debug(
            `ORGiD VC of ${orgId} has been deployed to ipfs://${cid}`
          );

          const dstContract = getDstContract(network);
          await dstContract.createOrgIdFor(orgId, `ipfs://${cid}`, owner, []);
          logger.debug(`ORGiD ${orgId} has been registered`);
        } catch (error) {
          logger.error(error);
          throw error;
        }
      },
      {
        connection: redisDb,
        autorun: true,
      }
    );

    worker.on('completed', (job: Job) => {
      logger.debug('Completed job:', job.id);
    });

    worker.on('failed', (job: Job) => {
      logger.debug('Failed job:', job.id);
    });
  } catch (error) {
    logger.error(error);
  }
};
