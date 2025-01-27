const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customer = sequelize.define('Customer', {
    CustomerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    CustomerName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    MobileNo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Customer;
