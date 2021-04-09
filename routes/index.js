var express = require("express");
var router = express.Router();
var firebaseAdminDb = require("../connections/firebase_admin");
const bucket = require("../connections/firebase_storage");
var convertPagination = require("../modules/convertPagination"); //載入分頁模組

var moment = require("moment");
var striptags = require("striptags");


//上傳圖片
var Multer = require("multer");
var upload = Multer({
  //dest: "public/upload",
  storage: Multer.memoryStorage(), //3
  limits: {
    //4
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
  fileFilter(req, file, cb) {
    // 只接受三種圖片格式
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("Please upload an image"));
    }
    cb(null, true);
  },
});
//console.log(bucket);

const categoriesRef = firebaseAdminDb.ref("/categories/");
const articlesRef = firebaseAdminDb.ref("/articles/");
//const userRef = firebaseAdminDb.ref("/user/");

//上傳照片
router.post("/uploadimg", upload.single("photo"), async (req, res, next)=> {
  try {
    if (!req.file) {
      res.status(400).send("Error, could not upload file");
      return;
    }

    // Create new blob in the bucket referencing the file
    const blob = bucket.file(req.file.originalname);

    // Create writable stream and specifying file mimetype
    const blobWriter = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobWriter.on("error", (err) => next(err));

    blobWriter.on("finish", () => {
      // Assembling public URL for accessing the file via HTTP
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURI(blob.name)}?alt=media`;

      // Return the file name and its public URL
      res
        .status(200)
        .redirect("/")
        //.send({ fileName: req.file.originalname, fileLocation: publicUrl });
    });

    // When there is no more data to be consumed from the stream
    blobWriter.end(req.file.buffer);
  } catch (error) {
    res.status(400).send(`Error, could not upload file: ${error}`);
    return;
  }
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
