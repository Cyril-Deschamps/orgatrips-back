import express from "express"; // call express
import { project_name } from "../config/config";

// GET ALL OUR CONTROLLERS NEEDED TO PROCESS OUR ROUTES
import {
  authenticate,
  hasCookies,
  isAuthenticated,
  logout,
} from "../controllers/userController";

import { contact } from "../controllers/contactController";
import { AppError } from "../services/errorService";
import usersRouter from "./users.js";
import citiesRouter from "./cities.js";
import airportsRouter from "./airports";
import articlesRouter from "./articles";

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router(); // get an instance of the express Router

router.use("/users", usersRouter);
router.use("/cities", citiesRouter);
router.use("/airports", airportsRouter);
router.use("/articles", articlesRouter);

/**
 * @api {get} / Test route
 * @apiVersion 1.0.0
 * @apiGroup Test
 *
 * @apiSuccess {string} message yeah! welcome to the the sample api!
 * @apiSuccessExample Success
 *     HTTP/1.1 200 yeah! welcome to the the sample api!
 */
router.get("/", (req, res) => {
  res.json({
    message: `Welcome to ${project_name} REST api!`,
  });
});

router.get("/test", (req, res, next) => {
  try {
    throw new AppError(404, "user not found");
  } catch (error) {
    next(error);
  }
});

/**
 * @api {Post} /login Login route
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {string} email  User email.
 * @apiParam {string} password  User password.
 * @apiParamExample {json} Request
 *     {
 *       email: "test@test.com"
 *       password: "mypass"
 *     }
 *
 * @apiSuccess {string} message Enjoy your token!
 * @apiSuccess {object} user User's object.
 * @apiSuccessExample Success
 *     HTTP/1.1 200
 *     {
 *       message: "Enjoy your token!",
 *       user: {
 *          email: "test@test.com",
 *          ...
 *          xsrfToken: "xxx"
 *       }
 *     }
 *
 * @apiError 400 Incomplete request.
 * @apiError 401 Wrong email/password.
 * @apiError 412 Email not validated for this account.
 * @apiErrorExample Error 400
 *     HTTP/1.1 400 Incomplete request.
 * @apiErrorExample Error 404
 *     HTTP/1.1 404 Authentication failed.
 * @apiErrorExample Error 412
 *     HTTP/1.1 412 Email not validated for this account.
 */
router.post("/login", authenticate);

/**
 * @api {get} /logout Logout route
 * @apiVersion 1.0.0
 * @apiGroup Users
 * @apiPermission Logged user
 *
 * @apiHeader {String} x-xsrf-token Users unique access-key.
 * @apiHeaderExample {json} Headers
 *     {
 *       "x-xsrf-token": "xxx"
 *     }
 *
 * @apiSuccess {string} message Cookie successfully deleted.
 * @apiSuccessExample Success
 *     HTTP/1.1 200 Cookie successfully deleted.
 */
router.get("/logout", logout);

/**
 * @api {post} /security Test authent cookie route
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParamExample {json} Request
 *     { }
 *
 * @apiSuccess {string} message Your authent cookie is present!
 * @apiSuccessExample Success
 *     HTTP/1.1 200 Your authent cookie is present!
 *
 * @apiError 401 No token provided.
 * @apiErrorExample Error 401
 *     HTTP/1.1 401 No token provided.
 */
router.post("/security", hasCookies);

/**
 * @api {get} /authenticated Test authentication route
 * @apiVersion 1.0.0
 * @apiGroup Users
 * @apiPermission Logged user
 *
 * @apiHeader {String} x-xsrf-token Users unique access-key.
 * @apiHeaderExample {json} Headers
 *     {
 *       "x-xsrf-token": "xxx"
 *     }
 *
 * @apiSuccess {string} message You are still authenticated.
 *
 * @apiSuccessExample Success
 *     HTTP/1.1 200 You are still authenticated.
 *
 * @apiError 401 No token provided / failed to authenticate token.
 * @apiErrorExample Error 401
 *     HTTP/1.1 401 No token provided / failed to authenticate token.
 */
router.get("/authenticated", isAuthenticated, (req, res) =>
  res.sendStatus(200),
);

router
  .route("/contact")
  /**
   * @api {post} /contact Send a contact mail
   * @apiVersion 1.0.0
   * @apiGroup Contact
   *
   * @apiParam {string} email User email.
   * @apiParam {string} name User name.
   * @apiParam {string} message Mail message.
   * @apiParam {string} subject Mail subject.
   * @apiParamExample {json} Request
   *     {
   *       email: "test@test.com",
   *       name: "Test",
   *       message: "Test",
   *       subject: "Test"
   *     }
   *
   * @apiSuccess {string} message Contact mail successfully send.
   * @apiSuccessExample Success
   *     HTTP/1.1 200 Contact mail successfully send / invalid mail.
   *
   * @apiError 400 Incomplete request.
   * @apiErrorExample Error 400
   *     HTTP/1.1 400 Incomplete request.
   */
  .post(contact);

export default router; //make our router available for require module
