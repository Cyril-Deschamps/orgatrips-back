import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;

export const PUBLIC_ATTRIBUTES = ["id", "name", "countryCode"];

export const AIRPORT_TYPE = {
  SMALL_AIRPORT: 0,
  MEDIUM_AIRPORT: 1,
  LARGE_AIRPORT: 2,
};

export default function (sequelize) {
  class Airport extends Model {
    static associate(models) {
      models.Airport.hasMany(models.Trip, {
        foreignKey: {
          name: "DepartureAirportIataCode",
        },
      });
    }
  }

  Airport.init(
    {
      iataCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING(3),
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
      type: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
      },
    },
    {
      sequelize,
      indexes: [
        { type: "FULLTEXT", name: "search_index", fields: ["name", "city"] },
      ],
    },
  );

  return Airport;
}
