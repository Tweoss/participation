// var csv = require('./jquery.csv.js');

fetch('./points.csv')
    .then(response => response.text())
    .then(data => {
            // console.log(data)
            var data = $.csv.toObjects(data);
            console.log(data)
        }

    );