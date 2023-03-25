import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;

export default function (sequelize) {
  class SearchTripsAnalytic extends Model {
    static associate() {
      /* Do Nothing*/
    }
  }

  SearchTripsAnalytic.init(
    {
      departureCity: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      locale: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      budgetMax: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
    },
  );

  return SearchTripsAnalytic;
}
