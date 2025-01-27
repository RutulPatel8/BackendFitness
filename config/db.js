// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize('car_fitness_point', 'root','Raj@5656', {
//     host: '127.0.0.1',
//     dialect: 'mysql',
// });

// sequelize.authenticate()
//     .then(() => console.log('Database connected...'))
//     .catch((err) => console.error('Error:', err));

// module.exports = sequelize;
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('car_fitness_point', 'root','Divyaraj#45', {
    host: '127.0.0.1',
    dialect: 'mysql',
});

sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch((err) => console.error('Error:', err));

module.exports = sequelize;
