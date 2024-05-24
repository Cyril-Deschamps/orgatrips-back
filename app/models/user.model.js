import sequelize from "sequelize";
const { DataTypes, Model } = sequelize;

export const PUBLIC_ATTRIBUTES = [
  "id",
  "email",
  "firstname",
  "lastname",
  "admin",
];

export const REGISTER_REQUIRED_FIELDS = ["email", "password"];

export const UPDATABLE_FIELDS = ["firstname", "lastname"];

export default function (sequelize) {
  class User extends Model {
    static associate(models) {
      models.User.hasMany(models.Trip);
      models.User.belongsToMany(models.Trip, {
        through: "likes",
        as: "TripLike",
      });
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
      admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      password: {
        type: DataTypes.STRING(70),
        allowNull: false,
      },
    },
    {
      sequelize,
    },
  );

  return User;
}
