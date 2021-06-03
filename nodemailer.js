const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'anna.biryuk211@gmail.com',
        pass: 'jKVH3vGo'
    }
}, {
    from: 'Mailer Test <anna.biryuk211@gmail.com>',

});

const mailer = message => {
    transporter.sendMail(message, (err, info) => {
        if (err) return console.log(err);
        console.log(`Email sent:`, info)

    })
}

module.exports = mailer;