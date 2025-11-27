module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define(
    "UserProfile",
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      address1: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      address2: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      zip: {
        type: DataTypes.STRING(9),
        allowNull: false,
      },
      skills: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      preferences: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      availability: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      tableName: "UserProfiles",
    }
  );

  UserProfile.associate = (models) => {
    if (models.User) {
      UserProfile.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  };

  return UserProfile;
};

