const { Router } = require('express');
const course = require('../models/course');
const Course = require('../models/course');
const auth = require('../middleware/auth');

const router = Router();

function mapCartItems(cart) {
    const result = cart.items.map(item => ({
        ...item.courseId._doc, count: item.count
    }));

    return result;
}

function computePrice(courses) {
    return courses.reduce((total, course) => {
        return total + course.price * course.count;
    }, 0)
}

router.post('/add', auth, async (req, res) => {
    const course = await Course.findById(req.body.id);
    await req.user.addToCart(course)
    res.redirect('/card')
})

router.get('/', auth, async (req, res) => {
    const user = await req.user
        .populate('cart.items.courseId').execPopulate();

    const courses = mapCartItems(user.cart)
    res.render('card', {
        title: 'Корзина',
        isCard: true,
        courses: courses,
        totalPrice: computePrice(courses),
    })
})

router.delete('/remove/:id', auth, async (req, res) => {
    await req.user.removeFromCart(req.params.id);
    const user = await req.user.populate('cart.items.courseId').execPopulate();
    const courses = mapCartItems(user.cart)
    const cart = {
        courses, totalPrice: computePrice(courses)
    }
    res.status(200).json(cart);
})


module.exports = router;