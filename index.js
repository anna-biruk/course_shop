const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session)
const path = require('path');
const mongoose = require('mongoose');
const helmet = require("helmet");
const csrf = require('csurf');
const flash = require('connect-flash');
const exhbs = require('express-handlebars');
const compression = require('compression')
const homeRoutes = require('./routes/home');
const addRoutes = require('./routes/add');
const coursesRotes = require('./routes/courses');
const cardRoutes = require('./routes/card');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const varMiddleware = require('./middleware/variables');
const userMiddleware = require('./middleware/user');
const fileMiddleware = require('./middleware/file')
const profileRoutes = require('./routes/profile')
const errorHandler = require('./middleware/error')
const keys = require('./keys');

const app = express();

const hbs = exhbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    helpers: require('./utils/hbs-helpers')
})


const password = '4KwchTQjAxGmKlM1';
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs');
app.set('views', 'views');

const store = new MongoStore({
    collection: 'sessions',
    uri: keys.MONGODB_URI,
});


app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(session({
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store
}))
app.use(fileMiddleware.single('avatar'));
app.use(csrf())
app.use(flash())
app.use(varMiddleware)
app.use(userMiddleware)
app.use(helmet())
app.use(compression())


app.use('/', homeRoutes)
app.use('/add', addRoutes)
app.use('/courses', coursesRotes)
app.use('/card', cardRoutes)
app.use('/orders', ordersRoutes)
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes)

app.use(errorHandler)



const PORT = process.env.PORT || 3000;


async function start() {
    try {
        await mongoose.connect(keys.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false

        })

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (e) {
        console.log(e)
    }

}

start()



