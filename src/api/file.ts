import { Request } from 'express';
import axios from 'axios';
import { fromBuffer } from 'strtok3';
import { UploadedFile } from '../types';
import { ApiError } from '../errors';
import { addBufferToIpfs } from '../ipfs';
import { imageFileTypeFromBuffer, simpleUid } from '../utils';

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
