import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { AiService } from './ai.service'
import { AiChatDto } from './dto/ai-chat.dto'
import { AiFeedbackDto } from './dto/ai-feedback.dto'
import { AiUserThrottlerGuard } from './ai-throttler.guard'

@Controller('ai')
@UseGuards(ChurchContextGuard, AiUserThrottlerGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/chat - ask the church assistant. Read-only; returns validated
   * UI components. Any signed-in member may ask; each read tool re-checks
   * its own permission.
   */
  @Post('chat')
  @RequirePermission('read:self')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  async chat(@Req() request: Request, @Body() dto: AiChatDto) {
    const user = request.user as { id: string; role: string }
    return this.aiService.chat(
      { userId: user.id, role: user.role, churchId: request['churchId'] as string },
      { message: dto.message, conversationId: dto.conversationId },
    )
  }

  /**
   * POST /ai/feedback - rate one answer as helpful or not helpful. Only the conversation's
   * owner can rate it, and only while the answer is still in the stored history.
   */
  @Post('feedback')
  @RequirePermission('read:self')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  async feedback(@Req() request: Request, @Body() dto: AiFeedbackDto) {
    const user = request.user as { id: string; role: string }
    return this.aiService.feedback(
      { userId: user.id, role: user.role, churchId: request['churchId'] as string },
      { conversationId: dto.conversationId, answerId: dto.answerId, rating: dto.rating },
    )
  }
}
