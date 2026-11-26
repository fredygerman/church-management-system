/**
 * RM-004: members see published events only (list and detail); draft detail is a 404.
 * Staff with manage:events keep seeing drafts.
 */
jest.mock('@church/db', () => ({ db: {}, events: {}, eventRsvps: {}, members: {}, churches: {} }))
jest.mock('../members/members.service', () => ({ MembersService: class MembersService {} }))

import { NotFoundException } from '@nestjs/common'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'
import { MembersService } from '../members/members.service'

const CHURCH_A = 'church-a'
const DRAFT_ID = 'draft-1'

function makeRequest(role: string, extra: Record<string, unknown> = {}) {
  return {
    churchId: CHURCH_A,
    user: { id: 'user-1', role, ...extra },
  } as any
}

describe('EventsController visibility (RM-004)', () => {
  let eventsService: { getEventsByChurch: jest.Mock; getEventByIdInChurch: jest.Mock }
  let controller: EventsController

  beforeEach(() => {
    eventsService = {
      getEventsByChurch: jest.fn().mockResolvedValue([]),
      getEventByIdInChurch: jest.fn().mockResolvedValue(undefined),
    }
    controller = new EventsController(
      eventsService as unknown as EventsService,
      {} as unknown as MembersService,
    )
  })

  it('member list is published-only and ignores a status=draft query', async () => {
    await controller.list(makeRequest('member'), undefined, undefined, 'draft' as any)

    expect(eventsService.getEventsByChurch).toHaveBeenCalledWith(
      CHURCH_A,
      { from: undefined, to: undefined, status: undefined, scope: undefined },
      true,
      undefined,
      undefined,
    )
  })

  it('admin list keeps drafts and honours the status filter', async () => {
    await controller.list(makeRequest('admin'), undefined, undefined, 'draft' as any)

    expect(eventsService.getEventsByChurch).toHaveBeenCalledWith(
      CHURCH_A,
      expect.objectContaining({ status: 'draft' }),
      false,
      undefined,
      undefined,
    )
  })

  it('member detail of a draft returns 404 with the existing message', async () => {
    await expect(controller.getOne(makeRequest('member'), DRAFT_ID)).rejects.toThrow(
      new NotFoundException(`Event with ID ${DRAFT_ID} not found`),
    )
    expect(eventsService.getEventByIdInChurch).toHaveBeenCalledWith(CHURCH_A, DRAFT_ID, true)
  })

  it('admin detail of a draft is returned', async () => {
    const draft = { id: DRAFT_ID, status: 'draft' }
    eventsService.getEventByIdInChurch.mockResolvedValueOnce(draft)

    await expect(controller.getOne(makeRequest('admin'), DRAFT_ID)).resolves.toBe(draft)
    expect(eventsService.getEventByIdInChurch).toHaveBeenCalledWith(CHURCH_A, DRAFT_ID, false)
  })

  it('platform admin sees drafts even with a member role in the church', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = 'user-1'
    try {
      const draft = { id: DRAFT_ID, status: 'draft' }
      eventsService.getEventByIdInChurch.mockResolvedValueOnce(draft)

      await expect(controller.getOne(makeRequest('member'), DRAFT_ID)).resolves.toBe(draft)
      expect(eventsService.getEventByIdInChurch).toHaveBeenCalledWith(CHURCH_A, DRAFT_ID, false)
    } finally {
      delete process.env.PLATFORM_ADMIN_USER_IDS
    }
  })
})
