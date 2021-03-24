var express = require("express");
const { route } = require(".");
var router = express.Router();
var firebaseDb = require("../connections/firebase");
var firebaseAdminDb = require("../connections/firebase_admin");
var fireAuth = firebaseDb.auth();

//顯示註冊頁面
router.get("/signup", function (req, res) {
  res.render("dashboard/signup", { error: req.flash("error") });
});

//註冊
router.post("/signup", function (req, res) {
  let email = req.body.email;
  let password = req.body.password;
  let name = req.body.name;
  fireAuth
    .createUserWithEmailAndPassword(email, password)
    .then(function (user) {
      let saveUser = {
        email: email,
        name: name,
        uid: user.user.uid,
      };
      firebaseAdminDb.ref("/user/" + user.user.uid).set(saveUser);
      res.redirect("/auth/login");
    })
    .catch(function (error) {
      let errorMessage = error.message;
      req.flash("error", errorMessage);
      res.redirect("/auth/signup");
    });
});

//顯示登入頁面
router.get("/login", function (req, res) {
  res.render("dashboard/login");
});

//登入
router.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  fireAuth
    .signInWithEmailAndPassword(email, password)
    .then(function (user) {
      console.log(user.user.uid);
      req.session.uid = user.user.uid;
     // console.log(req.session.uid);
      res.redirect("/");
    })
    .catch(function (error) {
      req.flash("error", error.message);
      res.redirect("/auth/signup");
    });
});

//登出
router.get("/logout", function (req, res) {
  req.session.uid = "";
  res.redirect('/auth/login');
});

module.exports = router;
