import { Controller, Get } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NoCache } from 'src/common/decorators/no-cache.decorator';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @NoCache()
  @ApiOperation({ summary: 'Get all available routes' })
  getAllRoutes() {
    const routes = this.routesService.getAllRoutes();

    return {
      success: true,
      message: 'All available routes',
      totalRoutes: routes.length,
      data: routes,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('grouped')
  @NoCache()
  @ApiOperation({ summary: 'Get routes grouped by module' })
  getGroupedRoutes() {
    const groupedRoutes = this.routesService.getGroupedRoutes();

    return {
      success: true,
      message: 'Routes grouped by module',
      data: groupedRoutes,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  @NoCache()
  @ApiOperation({ summary: 'Get route statistics' })
  getRouteStats() {
    const stats = this.routesService.getRouteStats();

    return {
      success: true,
      message: 'Route statistics',
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }
}
