import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  setupDirectories
} from './storage';
import { isVideoNew, setVideo } from './firestore';

setupDirectories();

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
  let data: any;
  let inputFileName: string;

  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    console.log('Raw Pub/Sub message:', message);
    data = JSON.parse(message);

    inputFileName = data.name;
    if (!inputFileName || typeof inputFileName !== 'string') {
      throw new Error('Invalid or missing filename in object metadata.');
    }

    if (inputFileName.includes('/')) {
      throw new Error('Filename cannot include slashes.');
    }

    if (!inputFileName.endsWith('.mov')) {
      console.log('Skipping non-.mov file:', inputFileName);
      return res.status(204).send(); // No Content
    }

  } catch (error) {
    console.error('Failed to parse Pub/Sub message:', error);
    return res.status(400).send('Bad Request: invalid message format.');
  }

  const outputFileName = `processed-${inputFileName}`;
  const uuid = uuidv4();
  const localRawFileName = `${uuid}-${inputFileName}`;
  const localProcessedFileName = `${uuid}-${outputFileName}`;
  const videoId = localRawFileName.split('-')[1];

  if (!isVideoNew(videoId)) {
    return res.status(400).send('Video already exists');
  } else {
    await setVideo(videoId, {
      id: videoId,
      uid: videoId,
      status: 'processing'
  });

  try {
    console.log(`Downloading raw video: ${inputFileName} -> ${localRawFileName}`);
    await downloadRawVideo(inputFileName, localRawFileName);

    console.log(`Converting video: ${localRawFileName} -> ${localProcessedFileName}`);
    await convertVideo(localRawFileName, localProcessedFileName);

    console.log(`Uploading processed video: ${localProcessedFileName} -> ${outputFileName}`);
    await uploadProcessedVideo(localProcessedFileName, outputFileName);
  } catch (err) {
    console.error('Processing error:', err);
    await Promise.all([
      deleteRawVideo(localRawFileName),
      deleteProcessedVideo(localProcessedFileName)
    ]);
    return res.status(500).send('Processing failed');
  }

  await setVideo(videoId, {
    status: 'processed',
    filename: outputFileName,
  });

  await Promise.all([
    deleteRawVideo(localRawFileName),
    deleteProcessedVideo(localProcessedFileName)
  ]);

  return res.status(200).send('Processing finished successfully');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
