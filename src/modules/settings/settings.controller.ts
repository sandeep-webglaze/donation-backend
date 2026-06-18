import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Public — used by the website header/footer and default SEO.
   * GET /api/settings
   */
  @Get()
  @Public()
  get() {
    return this.settingsService.get();
  }

  /**
   * Admin — update website settings.
   * PATCH /api/settings
   */
  @Patch()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
