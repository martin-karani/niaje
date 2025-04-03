import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user.dto';
import { BetterGuard } from 'src/common/guards/auth-guard';

@Controller('users')
@UseGuards(BetterGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get the authenticated user's own profile
  @Get('me')
  async getOwnProfile(@CurrentUser() user: User) {
    return this.usersService.getUserProfile(user.id);
  }

  // Update the authenticated user's own profile
  @Patch('me') // Use PATCH for partial updates
  async updateOwnProfile(
    @CurrentUser() user: User,
    @Body() updateData: UpdateUserProfileDto, // Use the DTO
  ) {
    // Pass only the DTO data to the service
    return this.usersService.updateUserProfile(user.id, updateData);
  }

  // --- Admin Routes ---

  // Get all users (admin only)
  @Get()
  @Roles(UserRole.ADMIN) // Apply role check
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  // Get a specific user by ID (admin, or landlord accessing related user)
  @Get(':id')
  async getUserById(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // Check if requesting self
    if (id === currentUser.id) {
      return this.usersService.getUserProfile(id);
    }

    // Allow admin access
    if (currentUser.role === UserRole.ADMIN) {
      return this.usersService.getUserProfile(id);
    }

    // Allow landlord to access their linked agents/caretakers
    if (currentUser.role === UserRole.LANDLORD) {
      const canAccess = await this.usersService.canLandlordAccessUser(
        currentUser.id,
        id,
      );
      if (canAccess) {
        return this.usersService.getUserProfile(id);
      }
    }

    // If none of the above, forbid access
    throw new ForbiddenException(
      'You do not have permission to access this user profile',
    );
  }

  // Create a new user (admin only) - Note: This only creates the User record
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() userData: AdminCreateUserDto) {
    // Use the DTO
    // Service method is now adminCreateUser and doesn't handle password
    return this.usersService.adminCreateUser(userData);
  }
}
