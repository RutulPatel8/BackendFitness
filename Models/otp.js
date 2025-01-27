// models/Otp.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure sequelize is imported correctly

const Otp = sequelize.define('Otp', {
  otp_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile_no: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'otps',
});

module.exports = Otp;
