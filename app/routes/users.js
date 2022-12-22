import express from "express";
import {
  getUserById,
  hasAccessToUser,
  isAuthenticated,
  updateUser,
  accessUserProfilePic,
} from "../controllers/userController.js";
import { downloadFile } from "../services/fileService";

const usersRouter = express.Router();

usersRouter.use("/:user_id", isAuthenticated, hasAccessToUser);

// on routes that end in /users/:user_id
// ----------------------------------------------------
usersRouter
  .route("/:user_id")
  /**
   * @api {get} /users/:userId Get user by id route
   * @apiVersion 1.0.0
   * @apiGroup Users
   * @apiPermission Logged user
   *
   * @apiHeader {String} x-xsrf-token Users unique access-key.
   * @apiHeaderExample {json} Headers
   *     {
   *       "xsrfToken": "xxx"
   *     }
   *
   * @apiParam {string} userId  User id.
   *
   * @apiSuccess {object} user {...}
   * @apiSuccessExample Success
   *     HTTP/1.1 200 OK
   *     [{
   *          id: 25,
   *          email: "test@test.com",
   *          firstName: "toto",
   *          lastName: "tata"
   *     }]
   *
   * @apiError 400 Incomplete request.
   * @apiError 401 No token provided / failed to authenticate token.
   * @apiError 404 User not found.
   * @apiErrorExample Error 400
   *     HTTP/1.1 400 Incomplete request.
   * @apiErrorExample Error 401
   *     HTTP/1.1 401 No token provided / failed to authenticate token.
   * @apiErrorExample Error 404
   *     HTTP/1.1 404 User not found!
   */
  .get(getUserById)
  .put(updateUser, getUserById);

usersRouter
  .route("/:user_id/profile-pic")
  .get(accessUserProfilePic, downloadFile);

export default usersRouter;
