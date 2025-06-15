const validateData = (schema) => {
  return async (req, res, next) => {
    try {
      // If there is any error the catch will be the on cathing such error
      await schema.validateAsync(req.body, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      });

      return next();
    } catch (e) {
      console.log("🚀 ~ return ~ e:", e)
      
      if (e?.details) {
        return res.status(400).json({
           message: "you are not authorized",
            error: e
        })
      }

      return res.status(500).json({
        message: "Internal Server Error",
        error: e
      })
    }
  };
};

module.exports =  { validateData };