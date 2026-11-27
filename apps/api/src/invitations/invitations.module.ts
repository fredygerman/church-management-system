import { Module } from '@nestjs/common';
import { db } from '@church/db';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { DrizzleInvitationsRepository } from './drizzle-invitations.repository';
import { INVITATIONS_REPOSITORY } from './invitations.repository';
import { JoinThrottlerGuard } from './join-throttler.guard';

/**
 * Register this module in app.module.ts BEFORE ChurchModule. GET /churches/invitations
 * would otherwise be matched by ChurchController's GET /churches/:id.
 */
@Module({
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    JoinThrottlerGuard,
    {
      provide: INVITATIONS_REPOSITORY,
      useFactory: () => new DrizzleInvitationsRepository(db),
    },
  ],
})
export class InvitationsModule {}
