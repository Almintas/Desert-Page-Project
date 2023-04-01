const cors = require('cors');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
};

const connection = mysql.createConnection(mysqlConfig);

app.post('/register', (req, res) => {
    const { name, surname, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 12);

    connection.execute(
        'INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)', [name, surname, email, hashedPassword],
        (err, result) => {
            if (err?.code === 'ER_DUP_ENTRY') {
                res.sendStatus(400);
            }
            res.send(result);
        }
    )
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    connection.execute(
        'SELECT * FROM users WHERE email=?',
        [email], (err, result) => {
            if (result.length === 0) {
                res.sendStatus(401);
            } else {
                const passwordHash = result[0].password
                const isPasswordCorrect = bcrypt.compareSync(password, passwordHash);
                if (isPasswordCorrect) {
                    const { id, email } = result[0];
                    const token = jwt.sign({ id, email }, process.env.JWT_SECRET_KEY);
                    res.send({ token, id, email });
                } else {
                    res.sendStatus(401);
                }
            }
        }
    );
});

app.get('/desserts', (req, res) => {
    connection.execute('SELECT * FROM desserts WHERE id=?', 
    [id], (err, result) => {
        res.send(result)
    })
})


const PORT = 8080;
app.listen(PORT, () => console.log(`Server is online and port is ${PORT}`));