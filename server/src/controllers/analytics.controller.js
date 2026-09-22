import analyticsService from '../services/analytics.service.js';

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const data = await analyticsService.getOverview(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getStatusDistribution(req, res, next) {
    try {
      const data = await analyticsService.getStatusDistribution(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getPriorityDistribution(req, res, next) {
    try {
      const data = await analyticsService.getPriorityDistribution(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const data = await analyticsService.getTrends(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getCategoryAnalytics(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentWorkload(req, res, next) {
    try {
      const data = await analyticsService.getDepartmentWorkload(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getWardWorkload(req, res, next) {
    try {
      const data = await analyticsService.getWardWorkload(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getSLAAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getSLAAnalytics(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getWorkerWorkload(req, res, next) {
    try {
      const data = await analyticsService.getWorkerWorkload(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getMunicipalityAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getMunicipalityAnalytics(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getDistrictAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getDistrictAnalytics(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req, res, next) {
    try {
      const csv = await analyticsService.exportCsv(req.user, req.query);
      res.header('Content-Type', 'text/csv');
      res.attachment(`complaints_export_${new Date().getTime()}.csv`);
      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async getSystemStructure(req, res, next) {
    try {
      const data = await analyticsService.getSystemStructure(req.user);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getAreaWorkload(req, res, next) {
    try {
      const data = await analyticsService.getAreaWorkload(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivity(req, res, next) {
    try {
      const data = await analyticsService.getRecentActivity(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
