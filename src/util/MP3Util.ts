import { parseBuffer } from 'music-metadata';
import { readFileSync } from 'fs';

export async function extractEmbeddedImage(filePath: string) {
  try {
    // Read the MP3 file
    const mp3Data = readFileSync(filePath);

    // Parse ID3 tags
    const metadata = await parseBuffer(mp3Data, { mimeType: 'audio/mpeg' });

    // Extract embedded images
    const { common } = metadata;
    if (common && common.picture && common.picture.length > 0) {
      const picture = common.picture[0];
      // 'picture.format' contains the image format (e.g., 'image/jpeg')
      // 'picture.data' contains the image data as a Buffer
      return picture.data;
    } else {
      throw new Error('No embedded images found in the MP3 file.');
    }
  } catch (error) {
    return null;
  }
}

import { readdirSync, statSync } from 'fs';
import path from 'path';

interface Playlists {
  [key: string]: string;
}

interface FilesInfo {
  queue: string[];
  playlists: Playlists;
}

export function fetchRadioInformation(directory: string, parentDirectory: string = ''): FilesInfo {
  const filesInfo: FilesInfo = {
    queue: [],
    playlists: {}
  };

  const items = readdirSync(directory);
  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stat = statSync(itemPath);
    if (stat.isDirectory()) {
      const subdirectoryFiles = fetchRadioInformation(itemPath, directory);
      filesInfo.queue = filesInfo.queue.concat(subdirectoryFiles.queue);
      Object.assign(filesInfo.playlists, subdirectoryFiles.playlists);
    } else {
      const songName = path.basename(item, path.extname(item)).split(" - ")[1];
      filesInfo.queue.push(itemPath);
      if (!filesInfo.playlists[songName]) {
        const playlistName = path.basename(directory, path.extname(directory));
        if (playlistName == parentDirectory) continue;
        filesInfo.playlists[songName] = path.basename(playlistName);
      }
    }
  }

  return filesInfo;
}