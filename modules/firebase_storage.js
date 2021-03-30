const googleStorage = require('@google-cloud/storage');
const Multer = require('multer');

require("dotenv").config();

const storage = googleStorage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  },
});

const bucket = storage.bucket(process.env.FIREBASE_PROJECT_ID + ".appspot.com");
console.log(storage);

// 上傳檔案
const uploadImage = (file, folderName, fileName) => {
  let promise = new Promise((resolve, reject) => {
    if (!file) {
      reject("請上傳檔案");
    }

    let fileUpload = bucket.file(`${folderName}/${fileName}`);
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      console.log(error);
      reject("上傳檔案失敗");
    });

    blobStream.on("finish", () => {
      // The public URL can be used to directly access the file via HTTP.
      const firebaseFilePath = format(`${folderName}/${fileName}`);
      console.log(firebaseFilePath);
      resolve(firebaseFilePath);
    });
    blobStream.end(file.buffer);
  });
  return promise;
};

// 列出 storage 所有的檔案
const listFiles = function () {
  let promise = new Promise((resolve, reject) => {
    let fileNameList = [];
    bucket
      .getFiles()
      .then((results) => {
        const files = results[0];
        console.log("Files:");
        files.forEach((file) => {
          fileNameList.push(file.name);
        });
        resolve(fileNameList);
      })
      .catch((err) => {
        reject(err);
        console.log("error", err);
      });
  });
};

// 刪除檔案
const deleteFile = function (filePath) {
  let promise = new Promise((resolve, reject) => {
    bucket
      .file(filePath)
      .delete()
      .then(() => {
        resolve(true);
        //console.log(`gs://${bucketName}/${filename} deleted.`);
      })
      .catch((err) => {
        reject(err);
        console.error("ERROR:", err);
      });
  });

  return promise;
};

// 取得檔案對外 url
const generateSignedUrl = function (firePath) {
  let promise = new Promise(function (resolve, reject) {
    const options = {
      action: "read",
      expires: Date.now() + 50000 * 60 * 60,
    };

    bucket
      .file(firePath)
      .getSignedUrl(options)
      .then(function (results) {
        const url = results[0];
        // console.log(`The signed url for  is ${url}.`);
        return resolve(url);

        //console.log(`gs://${bucketName}/${filename} deleted.`);
      })
      .catch((err) => {
        reject(err);
        console.error("ERROR:", err);
      });
  });
  return promise;
};

module.exports = {
  uploadImage,
  listFiles,
  deleteFile,
  generateSignedUrl,
};
