const {Router} = require('express')
const router = new Router();

const categoryRoutes = require("./categoryRoutes");
const flowerRoutes = require("./flowerRoutes");

router.use("/categories", categoryRoutes);
router.use("/flowers", flowerRoutes)

module.exports  = router