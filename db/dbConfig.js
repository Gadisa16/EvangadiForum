const mysql2 = require('mysql2');

const dbconnection = mysql2.createPool({
    host: 'localhost',
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    connectionLimit: 10
});

// dbconnection.execute("select 'test'", (err, result) => {
//     if (err) {
//         console.log(err.message);
//     } else {
//         console.log(result);
//     }
// });

module.exports = dbconnection.promise();