import {onCall, onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {getAuth} from "firebase-admin/auth";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const rawVideoBucketName = "testing1295-raw-videos";

const videoCollectionId = "videos";

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: "processing" | "processed",
  title?: string,
  description?: string
}


export const createUser = onCall((request) => {
  const {auth} = request;

  if (!auth) {
    throw new Error("User must be authenticated");
  }

  const userInfo = {
    uid: auth.uid,
    email: auth.token.email,
    photoUrl: auth.token.picture,
    createdAt: new Date(),
  };

  return firestore.collection("users").doc(auth.uid).set(userInfo)
    .then(() => {
      logger.info(`User Created: ${JSON.stringify(userInfo)}`);
      return {success: true, message: "User created successfully"};
    })
    .catch((error) => {
      logger.error("Error creating user:", error);
      throw new Error("Failed to create user");
    });
});

export const generateUploadUrl = onRequest({
  maxInstances: 1,
  cors: true,
}, async (request, response) => {
  // Set CORS headers
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Check if the user is authenticated (you'll need to pass auth token in
  // headers)
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    response.status(401).json({error: "No authorization header"});
    return;
  }

  try {
    const data = request.body;
    const bucket = storage.bucket(rawVideoBucketName);

    // Verify the auth token and get user ID
    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Generate a unique filename
    const fileName = `${userId}-${Date.now()}.${data.fileExtension}`;


    // Get a v4 signed URL for uploading file
    const [url] = await bucket.file(fileName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    response.json({url, fileName});
  } catch (error) {
    logger.error("Error generating upload URL:", error);
    response.status(500).json({error: "Failed to generate upload URL"});
  }
});

export const getVideos = onCall({maxInstances: 1}, async () => {
  const snapshot =
    await firestore.collection(videoCollectionId).limit(10).get();
  return snapshot.docs.map((doc) => doc.data());
});
