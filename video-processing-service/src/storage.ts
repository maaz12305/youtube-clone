import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const storage = new Storage();

const rawVideoBucketName = 'testing1295-raw-videos';
const processedVideoBucketName = 'testing1295-processed-videos';

const localRawVideoPath = './raw-videos';
const localProcessedVideoPath = './processed-videos';

export function setupDirectories() {
  ensureDirectoryExists(localRawVideoPath);
  ensureDirectoryExists(localProcessedVideoPath);
}

export function convertVideo(rawVideoName: string, processedVideoName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const inputPath = `${localRawVideoPath}/${rawVideoName}`;
    const outputPath = `${localProcessedVideoPath}/${processedVideoName}`;

    ffmpeg(inputPath)
      .outputOptions('-vf', 'scale=trunc(iw*360/ih/2)*2:360')
      .on('start', commandLine => console.log('Spawned ffmpeg with command:', commandLine))
      .on('stderr', stderrLine => console.error('ffmpeg stderr:', stderrLine))
      .on('error', (err, stdout, stderr) => {
        console.error('ffmpeg error message:', err.message);
        console.error('ffmpeg stdout:', stdout);
        console.error('ffmpeg stderr:', stderr);
        reject(err);
      })
      .on('end', () => {
        console.log(`Conversion finished: ${outputPath}`);
        resolve();
      })
      .save(outputPath);
  });
}

export async function downloadRawVideo(remoteName: string, localName: string) {
  const destPath = `${localRawVideoPath}/${localName}`;
  await storage.bucket(rawVideoBucketName).file(remoteName).download({ destination: destPath });
  const exists = fs.existsSync(destPath);
  console.log(`Downloaded to: ${destPath}, file exists? ${exists}`);
  if (!exists) throw new Error(`Download failed — file not found at ${destPath}`);
}

export async function uploadProcessedVideo(localName: string, remoteName: string) {
  const filePath = `${localProcessedVideoPath}/${localName}`;
  const bucket = storage.bucket(processedVideoBucketName);
  console.log(`Uploading from ${filePath} to gs://${processedVideoBucketName}/${remoteName}`);
  await bucket.upload(filePath, { destination: remoteName });
  console.log(`${filePath} uploaded to gs://${processedVideoBucketName}/${remoteName}`);
  await bucket.file(remoteName).makePublic();
}

export function deleteRawVideo(fileName: string) {
  return deleteFile(`${localRawVideoPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string) {
  return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(`Failed to delete file at ${filePath}`);
          reject(err);
        } else {
          console.log(`Deleted file at ${filePath}`);
          resolve();
        }
      });
    } else {
      console.log(`File not found at ${filePath}, skipping deletion`);
      resolve();
    }
  });
}

function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory at ${dirPath}`);
  }
}
