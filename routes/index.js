const {Router} = require('express')
const router = new Router();

const categoryRoutes = require("./categoryRoutes");
const flowerRoutes = require("./flowerRoutes");
const authRoutes = require("./authRoutes")

router.use("/categories", categoryRoutes);
router.use("/flowers", flowerRoutes)
router.use("/auth", authRoutes)

module.exports  = router