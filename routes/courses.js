const { Router } = require('express');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const { courseValidators } = require('../utils/validators')
const { validationResult } = require('express-validator')
const router = Router();

function isOwner(course, req) {
    return course.userId.toString() === req.user._id.toString()
}
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({}, null, { lean: true })
            .populate('userId', 'email name')
            .select('title price img');
        res.render('courses', {
            title: 'Курсы',
            isCourses: true,
            userId: req.user ? req.user._id.toString() : null,
            courses
        })
    } catch (e) {
        console.log(e)
    }

})


router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).lean();
        res.render('course', {
            layout: 'empty',
            title: `Курс ${course.title}`,
            course
        })
    } catch (e) {
        console.log(e)
    }


})

router.get('/:id/edit', auth, async (req, res) => {
    if (!req.query.allow) {
        return res.redirect('/');
    }
    try {
        const course = await Course.findById(req.params.id).lean();
        if (!isOwner(course, req)) {
            return res.redirect('/courses')
        }
        res.render('edit-course', {
            title: `Редактировать курс ${course.title}`,
            course
        })
    } catch (e) {
        console.log(e)
    }


})

router.post('/edit', auth, courseValidators, async (req, res) => {
    const errors = validationResult(req);
    const { id, title, price, img } = req.body;

    if (!errors.isEmpty()) {
        return res.status(422).redirect(`/courses/${id}/edit?allow=true`)
        }

    
    try {
        const course = await Course.findById(id)
        if (!isOwner(course, req)) {
            return res.redirect('/courses')
        }

        await Course.findByIdAndUpdate(id, { title, price, img });
        res.redirect('/courses');
    } catch (e) {
        console.log(e)
    }

})

router.post('/remove', auth, async (req, res) => {
    try {
        await Course.deleteOne({
            _id: req.body.id,
            userId: req.user._id
        });
        res.redirect('/courses')
    } catch (e) {
        console.log(e)
    }

})




module.exports = router