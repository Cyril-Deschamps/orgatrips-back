import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;

export const PUBLIC_ATTRIBUTES = ["id", "name", "countryCode"];

export default function (sequelize) {
  class City extends Model {
    static associate() {
      /* Do Nothing*/
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
      kiwi_dst_popularity_score: {
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

  return City;
}
