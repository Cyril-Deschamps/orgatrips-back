import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;
import { join } from "path";
import { userProfilePicMediaPath, apiPath, back } from "../config/config";
import {
  ignoreURL,
  modelFileDeleter,
  modelFileWriter,
} from "../services/fileService";

export const PUBLIC_ATTRIBUTES = [
  "id",
  "email",
  "firstname",
  "lastname",
  "profilePic",
];

export const UPDATABLE_FIELDS = ["firstname", "lastname", "profilePic"];

export default function (sequelize) {
  class User extends Model {
    static associate(models) {
      /* Do Nothing*/
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      firstname: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      lastname: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      profilePic: {
        type: DataTypes.STRING(80),
        allowNull: true,
        get() {
          const profilePic = this.getDataValue("profilePic");
          return profilePic
            ? new URL(
                join(
                  apiPath,
                  "users",
                  String(this.getDataValue("id")),
                  "profile-pic",
                ),
                back,
              )
            : profilePic;
        },
      },
    },
    {
      sequelize,
    },
  );

  const profilePicWriter = ignoreURL(
    "profilePic",
    modelFileWriter(
      "profilePic",
      userProfilePicMediaPath,
      "profile_pic_",
      (mime, buffer) => {
        if (!mime.startsWith("image"))
          return Promise.reject(new Error("file not accepted"));

        if (buffer.length / 1024 > 500)
          return Promise.reject(new Error("Size too large"));
      },
    ),
  );

  User.beforeCreate(profilePicWriter);
  User.beforeUpdate(profilePicWriter);
  User.beforeDestroy(modelFileDeleter("profilePic", userProfilePicMediaPath));

  return User;
}
