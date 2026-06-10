/**
 * Async handler wrapper for Express route handlers.
 * Eliminates the need for try-catch blocks in every controller method.
 *
 * @param {Function} fn - Async Express route handler (req, res, next)
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/items', asyncHandler(async (req, res) => {
 *   const items = await ItemService.getAll();
 *   ApiResponse.success(items).send(res);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
