import express from "express";
import {
  authenticate,
  createUser,
  getUserById,
  hasAccessToUser,
  isAuthenticated,
  updateUser,
} from "../controllers/userController.js";

const usersRouter = () => {
  const usersRouter = express.Router();

  usersRouter.route("/").post(createUser, authenticate);

  usersRouter.use("/:user_id", isAuthenticated, hasAccessToUser);

  usersRouter.route("/:user_id").get(getUserById).put(updateUser, getUserById);

  return usersRouter;
};
export default usersRouter;
