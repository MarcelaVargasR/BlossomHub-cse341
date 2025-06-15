const {Router} = require('express')
const router = new Router();

const categoryRoutes = require("./categoryRoutes");
const flowerRoutes = require("./flowerRoutes");
const authRoutes = require("./authRoutes")
const order = require("./orderRoutes")
const user = require("./userRoutes")

router.use("/categories", categoryRoutes);
router.use("/flowers", flowerRoutes)
router.use("/auth", authRoutes)
router.use("/orders", order)
router.use("/users", user)


module.exports  = router