import { Request } from 'express';
import axios from 'axios';
import { fromBuffer } from 'strtok3';
import { UploadedFile } from '../types';
import { ApiError } from '../errors';
import { addBufferToIpfs, addJsonToIpfs } from '../ipfs';
import { imageFileTypeFromBuffer, simpleUid } from '../utils';
import { validateWithSchemaOrRef } from '@windingtree/org.id-utils/dist/object';
import { orgVc } from '@windingtree/org.json-schema';

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

export const getFileFromIpfs = async (cid: string): Promise<unknown> => {
  const { data } = await axios.get<unknown>(`https://w3s.link/ipfs/${cid}`);
  return data;
};
