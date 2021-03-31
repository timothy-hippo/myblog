var express = require("express");
var router = express.Router();
var firebaseAdminDb = require("../connections/firebase_admin");
var convertPagination = require("../modules/convertPagination"); //載入分頁模組
var moment = require("moment");
var striptags = require("striptags");

const categoriesRef = firebaseAdminDb.ref("/categories/");
const articlesRef = firebaseAdminDb.ref("/articles/");
//const userRef = firebaseAdminDb.ref("/user/");


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
