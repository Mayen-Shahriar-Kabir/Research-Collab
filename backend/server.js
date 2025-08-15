require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')

const app = express()

mongoose.connect(process.env.DB)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log('Inside port', process.env.PORT);
        });
    })
    .catch((error) => {
        console.log(error);
    });

