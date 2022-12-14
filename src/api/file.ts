import { Request } from 'express';
import axios from 'axios';
import { fromBuffer } from 'strtok3';
import { UploadedFile } from '../types';
import { ApiError } from '../errors';
import { addBufferToIpfs, addJsonToIpfs } from '../ipfs';
import { imageFileTypeFromBuffer, paramsSerializer, simpleUid } from '../utils';
import { validateWithSchemaOrRef } from '@windingtree/org.id-utils/dist/object';
import { orgVc } from '@windingtree/org.json-schema';
import { ORGJSON } from '@windingtree/org.json-schema/types/org.json';
import { DidResolutionResponse } from '@windingtree/org.id-resolver';
import { VALIDATOR_URI } from '../config';

export const processUpload = async (req: Request): Promise<UploadedFile> => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'File not been uploaded');
  }
  const file = req.files[0];
  const cid = await addBufferToIpfs(file.buffer, file.originalname);
  return {
    url: `https://w3s.link/ipfs/${cid}`,
  };
};

export const processUriUpload = async (uri: string): Promise<UploadedFile> => {
  const { data } = await axios.get(uri, { responseType: 'arraybuffer' });
  const tokens = fromBuffer(data);
  const fileType = await imageFileTypeFromBuffer(tokens);
  const cid = await addBufferToIpfs(data, `${simpleUid()}.${fileType}`);
  return {
    url: `https://w3s.link/ipfs/${cid}`,
  };
};

export const processOrgIdVcUpload = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawOrgIdVc: Record<string, any>
): Promise<UploadedFile> => {
  const validationResult = validateWithSchemaOrRef(orgVc, '', rawOrgIdVc);
  if (validationResult !== null) {
    throw new ApiError(400, `Invalid ORGiD VC: ${validationResult}`);
  }
  const cid = await addJsonToIpfs(rawOrgIdVc, `${simpleUid()}.json`);
  return {
    url: `ipfs://${cid}`,
  };
};

export const getFileFromIpfs = async <T = unknown>(cid: string): Promise<T> => {
  const { data } = await axios.get<T>(`https://w3s.link/ipfs/${cid}`);
  return data;
};

export const getOrgJsonFromOrgId = async (did: string): Promise<ORGJSON> => {
  const { data } = await axios.get<{
    resolutionResponse: DidResolutionResponse;
  }>(`${VALIDATOR_URI}/orgid`, {
    params: { orgid: did },
    paramsSerializer: {
      serialize: paramsSerializer,
    },
  });
  if (!data.resolutionResponse.didDocument) {
    throw new ApiError(
      400,
      data.resolutionResponse.didResolutionMetadata.error ??
        'Unknown ORGiD resolution error'
    );
  }
  return data.resolutionResponse.didDocument;
};
