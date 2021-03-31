var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var session = require("express-session");
var flash = require("connect-flash");
require("dotenv").config();

var indexRouter = require("./routes/index");
var dashboardRouter = require("./routes/dashboard");
var authRouter = require("./routes/auth");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", require("express-ejs-extend"));
app.set("view engine", "ejs");


//加入body解析
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//session設定
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 100 * 1000 },
  })
);

//connect-flash設定
app.use(flash());

const authCheck = function (req, res, next) {
  if (
    req.session.uid == process.env.ADMIN_UID ||
    req.session.uid == process.env.ADMIN_UID2 ||
    req.session.uid == process.env.ADMIN_UID3
  ) {
    //指定timothy80617這個帳號才能登入
    return next();
  } else {
    return res.redirect("/auth/login");
  }
};

app.use("/auth", authRouter);
app.use("/", authCheck, indexRouter);
app.use("/dashboard",authCheck, dashboardRouter);

//catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  res.render("error", { title: "找不到頁面" });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error", { title: "找不到頁面" });
});

module.exports = app;
