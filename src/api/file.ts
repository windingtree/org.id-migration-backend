import { Request } from 'express';
import { UploadedFile } from '../types';
import { ApiError } from '../errors';
import { addBufferToIpfs } from '../ipfs';

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
