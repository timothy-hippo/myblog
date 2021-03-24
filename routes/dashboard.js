var express = require("express");
var router = express.Router();
var firebaseAdminDb = require("../connections/firebase_admin");
var convertPagination = require("../modules/convertPagination"); //載入分頁模組
var moment = require("moment");
var striptags = require("striptags");

const categoriesRef = firebaseAdminDb.ref("/categories/");
const articlesRef = firebaseAdminDb.ref("/articles/");

router.get("/", function (req, res, next) {
  res.redirect("/dashboard/archives");
});

//文章列表
router.get("/archives", function (req, res, next) {
  const status = req.query.status || "public";
  let currencyPage = req.query.page;
  let categories = {};
  let url = "archives";
  categoriesRef.once("value").then(function (snapshot) {
    categories = snapshot.val();
    return articlesRef
      .orderByChild("update_time")
      .once("value")
      .then(function (snapshot) {
        let articles = [];
        snapshot.forEach(function (snapshotChild) {
          if (status === snapshotChild.val().status) {
            articles.push(snapshotChild.val());
          }
        });
        articles.reverse();
        const data = convertPagination(articles, currencyPage); //取得分頁模組資料
        res.render("dashboard/archives", {
          categories,
          articles: data.data,
          pagination: data.pagination,
          url,
          moment,
          striptags,
          status,
        });
      });
  });
});

//文章中顯示分類選項
router.get("/article/create", function (req, res, next) {
  categoriesRef.once("value", function (snapshot) {
    res.render("dashboard/article", { categories: snapshot.val() });
  });
});

//路由到指定文章編輯
router.get("/article/:id", function (req, res, next) {
  const id = req.param("id");
  var categories = {};
  categoriesRef
    .once("value")
    .then(function (snapshot) {
      categories = snapshot.val();
      return articlesRef.child(id).once("value");
    })
    .then(function (snapshot) {
      const article = snapshot.val();
      //console.log(article);
      res.render("dashboard/article", {
        categories,
        article,
      });
    });
});

//顯示分類
router.get("/categories", function (req, res, next) {
  const messages = req.flash("info");
  categoriesRef.once("value", function (snapshot) {
    res.render("dashboard/categories", {
      title: "分類管理",
      messages,
      hasInfo: messages.length > 0,
      categories: snapshot.val(),
    });
  });
});

//新增文章
router.post("/article/create", function (req, res, next) {
  const data = req.body;
  const articleRef = articlesRef.push();
  const key = articleRef.key;
  data.id = key;
  const updateTime = Math.floor(Date.now() / 1000);
  data.update_time = updateTime;
  data.uid = req.session.uid;
  articleRef.set(data).then(function () {
    //res.redirect(`/dashboard/article/${data.id}`);
    res.redirect(`/post/${data.id}`);
  });
});

//更新文章
router.post("/article/update/:id", function (req, res, next) {
  const data = req.body;
  const id = req.param("id");
  //console.log(data);
  articlesRef
    .child(id)
    .update(data)
    .then(function () {
      res.redirect(`/dashboard/article/${id}`);
    });
});

//刪除文章
router.post("/article/delete/:id", function (req, res, next) {
  const id = req.param("id");
  articlesRef.child(id).remove();
  req.flash("info", "欄位已刪除");
  res.end();
});

//新增分類
router.post("/categories/create", function (req, res, next) {
  const data = req.body;
  const categoryRef = categoriesRef.push();
  const key = categoryRef.key;
  data.id = key;
  categoriesRef
    .orderByChild("path")
    .equalTo(data.path)
    .once("value")
    .then(function (snapshot) {
      if (snapshot.val() !== null) {
        req.flash("info", "已有相同路徑");
        res.redirect("/dashboard/categories");
      } else {
        categoryRef.set(data).then(function () {
          res.redirect("/dashboard/categories");
        });
      }
    });
});

//編輯分類
router.post("/categories/:id", function (req, res, next) {
  const messages = req.flash("info");
  const id = req.param("id");
  let category = {};
  categoriesRef.once("value").then(function (snapshot) {
    snapshot.forEach(function (snapshotChild) {
      if (snapshotChild.val().id === id) {
        category = snapshotChild.val();
      }
    });
    res.render('dashboard/categories',{
      title: "分類管理",
      category,
      categories: snapshot.val(),
      messages,
      hasInfo: messages.length > 0,
    })
  });
});

//刪除分類
router.post("/categories/delete/:id", function (req, res, next) {
  const id = req.param("id");
  categoriesRef.child(id).remove();
  req.flash("info", "欄位已刪除");
  res.redirect("/dashboard/categories");
});

module.exports = router;
