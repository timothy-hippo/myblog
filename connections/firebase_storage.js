const { Storage } = require("@google-cloud/storage"); //載入google-cloud服務
require("dotenv").config();

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: "./myblog-71876-firebase-adminsdk-eny5u-6e477da037.json",
}); 

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL); 

module.exports = bucket;
