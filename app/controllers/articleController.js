import { join } from "path";
import { articlePicMediaPath } from "../config/config";
import { models } from "../models";
import { reloadPaths } from "../services/nextRenderService";

export async function getAllArticles(req, res, next) {
  try {
    const articles = await models.Article.findAll();
    return res.status(200).send(articles);
  } catch (e) {
    next(e);
  }
}

export async function getArticleBySlug(req, res, next) {
  try {
    const article = await models.Article.findByPk(req.params.article_slug);

    if (!article) {
      return res.sendStatus(404);
    }

    return res.status(200).send(article);
  } catch (e) {
    next(e);
  }
}

export async function createArticle(req, res, next) {
  try {
    let slug = req.body.title.replace(/\b\w+'(?=[A-Za-zÀ-ÖØ-öø-ÿ])/gi, "");
    slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    slug = slug.replace(/[^\w\s]/gi, "");
    slug = slug.replace(/\s+/g, "-");
    slug = slug.toLowerCase();

    const article = await models.Article.create(
      { ...req.body, slug },
      {
        individualHooks: true,
        hooks: true,
      },
    );
    await reloadPaths("/blog");
    return res.status(200).send(article);
  } catch (e) {
    next(e);
  }
}

export async function deleteArticle(req, res, next) {
  try {
    await models.Article.destroy({
      where: { slug: req.params.article_slug },
      individualHooks: true,
      hooks: true,
    });
    await reloadPaths("/blog");
    return res.sendStatus(200);
  } catch (e) {
    next(e);
  }
}

export async function updateArticle(req, res, next) {
  try {
    let slug = req.body.title.replace(/\b\w+'(?=[A-Za-zÀ-ÖØ-öø-ÿ])/gi, "");
    slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    slug = slug.replace(/[^\w\s]/gi, "");
    slug = slug.replace(/\s+/g, "-");
    slug = slug.toLowerCase();

    await models.Article.update(
      { ...req.body, slug },
      {
        where: { slug: req.params.article_slug },
        individualHooks: true,
        hooks: true,
      },
    );
    await reloadPaths("/blog");
    next();
  } catch (e) {
    next(e);
  }
}

export async function accessArticlePicture(req, res, next) {
  try {
    const article = await models.Article.findByPk(req.params.article_slug, {
      fields: [req.params.image_type],
    });
    if (!article || !article[req.params.image_type]) return res.sendStatus(404);

    req.file = {
      path: join(
        articlePicMediaPath,
        article.getDataValue(req.params.image_type),
      ),
    };
    next();
  } catch (error) {
    next(error);
  }
}
