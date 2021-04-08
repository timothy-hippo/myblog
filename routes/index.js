var express = require("express");
var router = express.Router();
var firebaseAdminDb = require("../connections/firebase_admin");
var convertPagination = require("../modules/convertPagination"); //載入分頁模組
require("dotenv").config();

const { Storage } = require("@google-cloud/storage"); //載入google-cloud服務

var moment = require("moment");
var striptags = require("striptags");
var fs = require("fs");

const storage = new Storage({
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
}); //2

//上傳圖片
var Multer = require("multer");
var upload = Multer({
  //dest: "public/upload",
  storage: Multer.memoryStorage(), //3
  limits: {
    //4
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
  // fileFilter(req, file, cb) {
  //   // 只接受三種圖片格式
  //   if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
  //     cb(new Error("Please upload an image"));
  //   }
  //   cb(null, true);
  // },
});
const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET); //5
console.log(bucket)

const categoriesRef = firebaseAdminDb.ref("/categories/");
const articlesRef = firebaseAdminDb.ref("/articles/");
//const userRef = firebaseAdminDb.ref("/user/");

//上傳照片
router.post("/uploadimg", upload.single("photo"), function (req, res, next) {
  console.log(req.file);
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();
  blobStream.on("error", (err) => {
    next(err);
  });

  blobStream.on("finish", () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);

  // let newPath = `public/upload/${file.originalname}`;
  // fs.rename(req.file.path, newPath, () => {
  //   console.log(req.file.path);
  //   console.log(req.newPath);
  //   res.redirect(`/upload/${file.originalname}`);
  // });
});

//前台預覽文章
router.get("/", function (req, res, next) {
  let currencyPage = req.query.page;
  let categories = {};
  let url = "index";
  let articlesTotal = 0;
  categoriesRef
    .once("value")
    .then(function (snapshot) {
      categories = snapshot.val();
      return articlesRef.orderByChild("update_time").once("value");
    })
    .then(function (snapshot) {
      let articles = [];
      snapshot.forEach(function (snapshotChild) {
        if (snapshotChild.val().status === "public") {
          articles.push(snapshotChild.val());
        }
      });
      articles.reverse();
      articlesTotal = articles.length;
      const data = convertPagination(articles, currencyPage); //取得分頁模組資料
      res.render("index", {
        articles: data.data,
        categories,
        articlesTotal,
        pagination: data.pagination,
        url,
        striptags,
        moment,
      });
    });
});

//前台以分類預覽文章
router.get("/:categoriePath", function (req, res, next) {
  let categoriePath = req.param("categoriePath");
  let currencyPage = req.query.page;
  let categories = {};
  let categoryId = "";
  let url = "category";
  let articlesTotal = 0;
  categoriesRef
    .once("value")
    .then(function (snapshot) {
      categories = snapshot.val();
      snapshot.forEach(function (categoriesChild) {
        if (categoriesChild.val().path == categoriePath) {
          categoryId = categoriesChild.val().id;
        }
      });
      if (categoryId == "") {
        res.render("error", { title: "找不到頁面" });
      }
      return articlesRef.orderByChild("update_time").once("value");
    })
    .then(function (snapshot) {
      let articles = [];
      snapshot.forEach(function (snapshotChild) {
        if (
          snapshotChild.val().status === "public" &&
          snapshotChild.val().category === categoryId
        ) {
          articles.push(snapshotChild.val());
        }
      });
      articles.reverse();
      articlesTotal = articles.length;
      const data = convertPagination(articles, currencyPage); //取得分頁模組資料
      res.render("index", {
        articles: data.data,
        categories,
        pagination: data.pagination,
        categoriePath,
        articlesTotal,
        url,
        striptags,
        moment,
      });
    });
});

//前台瀏覽文章
router.get("/post/:id", function (req, res, next) {
  const id = req.param("id");
  let categories = {};
  categoriesRef
    .once("value")
    .then(function (snapshot) {
      categories = snapshot.val();
      return articlesRef.child(id).once("value");
    })
    .then(function (snapshot) {
      const article = snapshot.val();
      if (!article) {
        return res.render("error", { title: "找不到頁面" });
      }
      res.render("post", { article, categories, moment });
    });
});

router.get("/dashboard/signup", function (req, res, next) {
  res.render("dashboard/signup", { title: "Express" });
});

module.exports = router;
