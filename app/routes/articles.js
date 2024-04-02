import express from "express";
import {
  getAllArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  createArticle,
  accessArticlePicture,
} from "../controllers/articleController";
import { downloadFile } from "../services/fileService";

const articlesRouter = express.Router();

articlesRouter.route("/").get(getAllArticles);
articlesRouter.route("/:article_slug").get(getArticleBySlug);

articlesRouter
  .route("/its-a-fucking-route-to-manage-article")
  .post(createArticle);

articlesRouter
  .route("/its-a-fucking-route-to-manage-article/:article_slug")
  .put(updateArticle, getArticleBySlug)
  .delete(deleteArticle);

articlesRouter
  .route("/:article_slug/:image_type")
  .get(accessArticlePicture, downloadFile);

export default articlesRouter;
