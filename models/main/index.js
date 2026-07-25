const Role = require("./Role");
const User = require("./User");
const Hospital = require("./Hospital");
const UserHospital = require("./UserHospital");

// Role → Users
Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

// User → Hospital Assignments
User.hasMany(UserHospital, {
  foreignKey: "userId",
  as: "hospitalAssignments",
});

UserHospital.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Hospital → User Assignments
Hospital.hasMany(UserHospital, {
  foreignKey: "hospitalId",
  as: "userAssignments",
});

UserHospital.belongsTo(Hospital, {
  foreignKey: "hospitalId",
  as: "hospital",
});

module.exports = {
  Role,
  User,
  Hospital,
  UserHospital,
};