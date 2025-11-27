module.exports = (sequelize, DataTypes) => {
  const VolunteerHistory = sequelize.define(
    "VolunteerHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      eventName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      eventDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      eventLocation: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      requiredSkills: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      urgency: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "upcoming",
        validate: {
          isIn: [["upcoming", "completed", "cancelled", "in-progress"]],
        },
      },
    },
    {
      tableName: "VolunteerHistory",
      timestamps: true,
      underscored: true,
    }
  );

  VolunteerHistory.associate = (models) => {
    VolunteerHistory.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    VolunteerHistory.belongsTo(models.Event, {
      foreignKey: "eventId",
      as: "event",
    });
  };

  return VolunteerHistory;
};

