const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Customer = require('./Customer');

const Transaction = sequelize.define('Transaction', {
    TransactionId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    VehicleNo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    OperationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    Price: {  // New column added
        type: DataTypes.FLOAT,  // or DataTypes.INTEGER depending on your requirement
        allowNull: false,  // set to true if you want it to be optional
    },
    VehicleType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    IsPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
  
});

Transaction.belongsTo(Customer, { foreignKey: 'CustomerId' });
Customer.hasMany(Transaction, { foreignKey: 'CustomerId' });

module.exports = Transaction;
