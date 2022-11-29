import { UploadedFile } from '../types';
import { ApiError } from '../errors';
import { addFilesToIpfs } from '../ipfs';

export const processUpload = async (
  files?: Express.Multer.File[]
): Promise<UploadedFile> => {
  if (!files) {
    throw new ApiError(400, 'Files not been uploaded');
  }
  const file = files[0];
  const cid = await addFilesToIpfs(file.destination);
  return {
    url: `https://w3s.link/ipfs/${cid}`,
  };
};
