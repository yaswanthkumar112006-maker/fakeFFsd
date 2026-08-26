import { Body, Controller, Get, Patch, Post, Req, UseFilters } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UserResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { UpdatePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import { ProfileExceptionFilter } from './filters/profile-exception.filter';

@ApiTags('profile')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('profile')
@UseFilters(ProfileExceptionFilter)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current actor profile' })
  @ApiOkResponse({ description: 'Profile returned successfully.', type: UserResponseDto })
  getMe(@Req() req: any) {
    return this.profileService.getMe(req.context);
  }

  @Patch('me')
  @ApiBody({ type: UpdateProfileDto })
  @ApiOperation({ summary: 'Update current actor profile' })
  @ApiOkResponse({ description: 'Profile updated successfully.', type: UserResponseDto })
  update(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.context, dto);
  }

  @Post('me/password')
  @ApiBody({ type: UpdatePasswordDto })
  @ApiOperation({ summary: 'Update current actor password' })
  @ApiOkResponse({ description: 'Password updated successfully.', type: UserResponseDto })
  updatePassword(@Req() req: any, @Body() dto: UpdatePasswordDto) {
    return this.profileService.updatePassword(req.context, dto);
  }
}
