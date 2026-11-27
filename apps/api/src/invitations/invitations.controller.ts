import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { GetUser } from '../auth/decorators';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ActorContext, CreateInvitationInput, InvitationsService } from './invitations.service';
import { JoinThrottlerGuard } from './join-throttler.guard';
import { SkipChurchContext } from './skip-church-context.decorator';

// Five join attempts per minute per user, and per IP via the global guard. Six wrong joins in a minute get 429.
export const JOIN_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

// Do not name route params `id` under /churches/: ChurchContextGuard reads params.id as a church id there.

/** Church context comes from the guard-verified active membership, never from the request body. */
function actorOf(user: any): ActorContext {
  const churchId = user?.activeChurchId ?? user?.churchId;
  if (!churchId) {
    throw new ForbiddenException('Church context is required for this operation');
  }
  return { userId: user.id, churchId };
}

@ApiTags('Church invitations')
@Controller('churches')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('invitations')
  @RequirePermission('manage:invitations')
  @HttpCode(HttpStatus.CREATED)
  createInvitation(@GetUser() user: any, @Body() body: CreateInvitationInput) {
    return this.invitations.createInvitation(actorOf(user), body ?? {}, new Date());
  }

  @Get('invitations')
  @RequirePermission('manage:invitations')
  listInvitations(@GetUser() user: any) {
    return this.invitations.listInvitations(actorOf(user), new Date());
  }

  @Delete('invitations/:invitationId')
  @RequirePermission('manage:invitations')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeInvitation(@GetUser() user: any, @Param('invitationId') invitationId: string) {
    return this.invitations.revokeInvitation(actorOf(user), invitationId, new Date());
  }

  @Post('join')
  @SkipChurchContext()
  @UseGuards(JoinThrottlerGuard)
  @Throttle(JOIN_THROTTLE)
  @HttpCode(HttpStatus.ACCEPTED)
  join(@GetUser() user: any, @Body() body: { code?: unknown }) {
    return this.invitations.join(user.id, body?.code, new Date());
  }

  @Get('memberships/pending')
  @RequirePermission('manage:invitations')
  listPendingMemberships(@GetUser() user: any) {
    return this.invitations.listPendingMemberships(actorOf(user));
  }

  @Post('memberships/:membershipId/approve')
  @RequirePermission('manage:invitations')
  @HttpCode(HttpStatus.OK)
  approveMembership(@GetUser() user: any, @Param('membershipId') membershipId: string) {
    return this.invitations.approveMembership(actorOf(user), membershipId, new Date());
  }

  @Post('memberships/:membershipId/reject')
  @RequirePermission('manage:invitations')
  @HttpCode(HttpStatus.OK)
  rejectMembership(@GetUser() user: any, @Param('membershipId') membershipId: string) {
    return this.invitations.rejectMembership(actorOf(user), membershipId, new Date());
  }
}
