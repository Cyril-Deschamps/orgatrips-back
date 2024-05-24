import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;

export default function (sequelize) {
  class Trip extends Model {
    static associate(models) {
      models.Trip.belongsTo(models.Airport, {
        as: "DepartureAirport",
      });
      models.Trip.belongsTo(models.City, {
        as: "DestinationCity",
      });
      models.Trip.belongsTo(models.User);
      models.Trip.belongsToMany(models.User, {
        through: "likes",
        as: "UserLike",
      });
    }
  }

  Trip.init(
    {
      nightsNumber: {
        type: DataTypes.INTEGER(3),
        allowNull: false,
      },
      travelersNumber: {
        type: DataTypes.INTEGER(2),
        allowNull: false,
      },
      transportationPrice: {
        type: DataTypes.INTEGER(6),
        allowNull: false,
      },
      transportationInboundDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transportationOutboundDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transportationStopOverInbound: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transportationStopOverOutbound: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transportationDepartureDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      transportationReturnDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      transportationArrivalLocalDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      transportationLeavingLocalDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      transportationBookingToken: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },
      accomodationAveragePricePerNight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      otherSpentBudget: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalBudget: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
    },
  );

  return Trip;
}
