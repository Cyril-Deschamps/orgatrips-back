import express from "express";
import {
  getAllArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  createArticle,
  accessArticlePicture,
} from "../controllers/articleController";
import { isAdmin, isAuthenticated } from "../controllers/userController";
import { downloadFile } from "../services/fileService";

const articlesRouter = () => {
  const articlesRouter = express.Router();

  articlesRouter
    .route("/")
    .get(getAllArticles)
    .post(isAuthenticated, isAdmin, createArticle);

  articlesRouter.route("/:article_slug").get(getArticleBySlug);

  articlesRouter
    .route("/:article_slug")
    .put(isAuthenticated, isAdmin, updateArticle, getArticleBySlug)
    .delete(isAuthenticated, isAdmin, deleteArticle);

  articlesRouter
    .route("/:article_slug/:image_type")
    .get(accessArticlePicture, downloadFile);

  return articlesRouter;
};
export default articlesRouter;
