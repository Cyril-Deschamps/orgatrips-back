import { join } from "path";
import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;
import {
  ignoreURL,
  modelFileDeleter,
  modelFileWriter,
} from "../services/fileService";
import { apiPath, back, articlePicMediaPath } from "../config/config";

export default function (sequelize) {
  class Article extends Model {}

  Article.init(
    {
      slug: {
        type: DataTypes.STRING(220),
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(400),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      readingTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING(60),
        allowNull: false,
        get() {
          const picture = this.getDataValue("image");
          return picture
            ? new URL(
                join(
                  apiPath,
                  "articles",
                  String(this.getDataValue("slug")),
                  "image",
                ),
                back,
              )
            : picture;
        },
      },
      thumbnail: {
        type: DataTypes.STRING(70),
        get() {
          const picture = this.getDataValue("thumbnail");
          return picture
            ? new URL(
                join(
                  apiPath,
                  "articles",
                  String(this.getDataValue("slug")),
                  "thumbnail",
                ),
                back,
              )
            : picture;
        },
      },
    },
    {
      sequelize,
    },
  );

  const pictureWriter = modelFileWriter(
    "image",
    articlePicMediaPath,
    "picture_",
    (mime) => {
      if (!mime.startsWith("image"))
        return Promise.reject(new Error("file not accepted"));
    },
    { quality: 70, width: 1500 },
    true,
  );

  Article.beforeCreate(ignoreURL("image", pictureWriter));

  Article.beforeUpdate(ignoreURL("image", pictureWriter));
  Article.beforeUpdate(ignoreURL("thumbnail"));

  Article.beforeDestroy(
    modelFileDeleter("image", articlePicMediaPath),
    modelFileDeleter("thumbnail", articlePicMediaPath),
  );

  return Article;
}
