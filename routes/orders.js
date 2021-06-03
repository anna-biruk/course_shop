const { Router } = require('express');
const router = Router();
const Order = require('../models/order');
const Course = require('../models/course');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({
            'user.userId': req.user._id
        }, null, { lean: true })
            .populate('user.userId')
        const mappedOrders = orders.map(order => {
            return {
                ...order,
                price: order.courses.reduce((total, courseItem) => {
                    return total + courseItem.count * courseItem.course.price
                }, 0)
            }
        });
        res.render('orders', {
            isOrder: true,
            title: 'Заказы',
            orders: mappedOrders
        })
    } catch (e) {
        console.log(e)
    }
});


router.post('/', auth, async (req, res) => {
    try {
        const user = await req.user
            .populate('.cart.items.courseId')
            .toObject();

        const userCourseIds = user.cart.items.map(item => item.courseId.toString());

        const userCourses = await Course.find({ _id: userCourseIds }, null, { lean: true });

        const courses = user.cart.items.map(item => {
            const course = userCourses.find(userCourse => userCourse._id.toString() === item.courseId.toString())
            return {
                count: item.count,
                course,
            }
        })

        const order = new Order({
            user: {
                name: req.user.name,
                userId: req.user
            },
            courses: courses
        })

        await order.save();
        await req.user.clearCart()

        res.redirect('/orders')
    } catch (e) {
        console.log(e)
    }
})


module.exports = router;