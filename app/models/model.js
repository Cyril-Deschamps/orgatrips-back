import sequelize from "sequelize";
const { Model: SequelizeModel } = sequelize;

class Model extends SequelizeModel {
  static belongsTo(target, options) {
    super.belongsTo(target, {
      ...(options || {}),
      foreignKey:
        options && options.foreignKey
          ? { allowNull: false, ...options.foreignKey }
          : { allowNull: false },
    });
  }

  static hasMany(target, options) {
    super.hasMany(target, {
      ...(options || {}),
      foreignKey:
        options && options.foreignKey
          ? { allowNull: false, ...options.foreignKey }
          : { allowNull: false },
    });
  }

  static hasOne(target, options) {
    super.hasOne(target, {
      ...(options || {}),
      foreignKey:
        options && options.foreignKey
          ? { allowNull: false, ...options.foreignKey }
          : { allowNull: false },
    });
  }
}

export default Model;
