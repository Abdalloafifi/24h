const category  = require('../models/category');
const asyncHandler = require('express-async-handler');
const xss = require("xss");

/**
 * @desc create new category
 * @route /api/categories
 * @method Post
 * @access public
 */

exports.createCategory = asyncHandler(async (req, res) => {
    try {
        const data = {
            status: xss(req.body.status),
            price: xss(req.body.price)

        }
        const { error } = vildateCategory(data);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const newCategory = new category({
            status: data.status,
            price: data.price,
            user: req.user.id
        });
        await newCategory.save();

        res.status(201).json({ message: "Category created successfully", data: newCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @desc get all categories
 * @route /api/categories/all
 * @method get
 * @access public
 */

exports.getCategories = asyncHandler(async (req, res) => {
    try {
        const categories = await category.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});