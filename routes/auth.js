const { Router } = require('express');
const router = Router();
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const mailer = require('../nodemailer');
const { registerValidators } = require('../utils/validators');
const keys = require('../keys/index');


router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: 'Авторизация',
        isLogin: true,
        loginError: req.flash('loginError'),
        registerError: req.flash('registerError')
    })
})
router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login')
    })

})


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const candidate = await User.findOne({ email })

        if (candidate) {
            const areSame = await bcrypt.compare(password, candidate.password)

            if (areSame) {
                req.session.user = candidate
                req.session.isAuthenticated = true
                req.session.save(err => {
                    if (err) {
                        throw err
                    }
                    res.redirect('/')
                })
            } else {
                req.flash('loginError', 'Неверный пароль')
                res.redirect('/auth/login#login')
            }
        } else {
            req.flash('loginError', 'Такого пользователя не существует')
            res.redirect('/auth/login#login')
        }
    } catch (e) {
        console.log(e)
    }
})

router.post('/register', registerValidators, async (req, res) => {
    try {
        const { email, password, name } = req.body;
        let hashPassword = await bcrypt.hash(password, 10);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('registerError', errors.array()[0].msg)
            return res.status(422).redirect('/auth/login#register')
        }

        const user = new User({
            email, name, password: hashPassword, cart: { items: [] }
        })
        const message = {
            to: req.body.email,
            subject: 'Congratulations! You are successfully registred on our site',
            html: `
                    <h2>Поздравляем! Вы успешно зарегестрировались на нашем сайте!</h2>
                    <i>Данные учетной записи:</i>
                        <ul>
                        <li> login:${req.body.email}</li>
                        <li> password:${req.body.password}</li>
                        </ul>
                      

                    <p> Данное письмо не требует ответа.</p>
                `
        }
        mailer(message)
        await user.save();
        res.redirect('/auth/login#login')
    }
    catch (err) {
        console.log(err)
    }
})


router.get('/reset', (req, res) => {
    res.render('auth/reset', {
        title: 'Забыли пароль',
        error: req.flash('error')
    })
});
router.get('/password/:token', async (req, res) => {
    if (!req.params.token) {
        return res.redirect('/auth/login')
    }
    try {
        const user = await User.findOne({
            resetToken: req.params.token,
            resetTokenExp: { $gt: Date.now() }

        })
        if (!user) {
            return res.redirect('/auth/login')
        } else {
            res.render('auth/password', {
                title: 'Восстановление пароля',
                error: req.flash('error'),
                userId: user._id.toString(),
                token: req.params.token
            })
        }

    } catch (e) {
        console.log(e)
    }

});

router.post('/reset', async (req, res) => {
    try {
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash('error', 'Что-то пошло не так, повторите попытку позже')
                return res.redirect('/auth/reset')
            }
            const token = buffer.toString('hex')
            const candidate = await User.findOne({ email: req.body.email });
            if (candidate) {
                candidate.resetToken = token;
                candidate.resetTokenExp = Date.now() + 60 * 60 * 1000;
                await candidate.save();
                const message = {
                    to: req.body.email,
                    subject: 'Восстановление пароля',
                    html: `
                        <h2>Вы забыли пароль?</h2>
                        <p>Если нет, то проигнорируйте данное письмо.</p>
                        <p >Иначе перейдите по ссылке ниже:</p>
                        <p> <a href='${keys.BASE_URL}/auth/password/${token}'>Восстановить пароль</a></p>
                        <hr/>
                    `
                }
                mailer(message);
                res.redirect('/auth/login')

            } else {
                req.flash('error', 'Пользователя с таким email не существует');
                res.redirect('/auth/reset')
            }

        })
    } catch (e) {
        console.log(e);
    }
})

router.post('/password', async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.body.userId,
            resetToken: req.body.token,
            resetTokenExp: { $gt: Date.now() }
        })

        if (user) {
            user.password = await bcrypt.hash(req.body.password, 10);
            user.resetToken = undefined;
            user.resetTokenExp = undefined;

            await user.save()
            res.redirect('/auth/login')

        } else {
            req.flash('lofinError', 'Время жизни токена истекло')
            res.redirect('/auth/login')
        }
    } catch (e) {
        console.log(e)
    }
})

module.exports = router;