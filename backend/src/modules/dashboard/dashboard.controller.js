const dashboardService = require('./dashboard.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Dashboard Controller
 */
class DashboardController {
  /**
   * GET /dashboard/summary — Get aggregated dashboard stats
   */
  getSummary = asyncHandler(async (req, res) => {
    const summary = await dashboardService.getSummary();
    ApiResponse.success(summary).send(res);
  });
}

module.exports = new DashboardController();
