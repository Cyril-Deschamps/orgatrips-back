import { join } from "path";
import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;
import { apiPath, back, cityPicMediaPath } from "../config/config";
import {
  ignoreURL,
  modelFileDeleter,
  modelFileWriter,
} from "../services/fileService";

export const PUBLIC_ATTRIBUTES = ["id", "name", "countryCode"];

export default function (sequelize) {
  class City extends Model {
    static associate(models) {
      models.City.hasMany(models.Trip, {
        foreignKey: {
          name: "DestinationCityId",
        },
      });
    }
  }

  City.init(
    {
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
      },
      kiwiDstPopularityScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lat: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      lon: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      soloPricePerPersonMin: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      soloPricePerPersonMax: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      multiplePricePerPersonMin: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      multiplePricePerPersonMax: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      cityPic: {
        type: DataTypes.STRING(80),
        allowNull: true,
        get() {
          const cityPic = this.getDataValue("cityPic");
          return cityPic
            ? new URL(
                join(
                  apiPath,
                  "cities",
                  String(this.getDataValue("id")),
                  "city-pic",
                ),
                back,
              )
            : cityPic;
        },
      },
    },
    {
      sequelize,
      indexes: [
        {
          unique: true,
          fields: ["slug"],
        },
        {
          unique: true,
          fields: ["name", "country_code"],
        },
      ],
    },
  );

  const cityPictureWriter = modelFileWriter(
    "cityPic",
    cityPicMediaPath,
    "city_picture_",
    (mime) => {
      if (!mime.startsWith("image"))
        return Promise.reject(new Error("file not accepted"));
    },
    { quality: 75, width: 900 },
  );

  City.beforeCreate(ignoreURL("cityPic", cityPictureWriter));
  City.beforeUpdate(ignoreURL("cityPic", cityPictureWriter));
  City.beforeDestroy(modelFileDeleter("cityPic", cityPicMediaPath));

  return City;
}
