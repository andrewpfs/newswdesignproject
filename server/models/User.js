module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "volunteer",
        validate: {
          isIn: [["volunteer", "admin"]],
        },
      },
    },
    {
      tableName: "Users",
      timestamps: true,
      underscored: true,
    }
  );

  User.associate = (models) => {
    User.hasOne(models.UserProfile, {
      foreignKey: "userId",
      as: "profile",
    });
  };

  return User;
};

