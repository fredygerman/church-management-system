/**
 * RM-013: PUT /churches/:id accepts only whitelisted fields. networkId (and id,
 * deletedAt, timestamps) must be rejected by validation and never written.
 */
const mockCaptured: Record<string, unknown>[] = []

jest.mock('@church/db', () => ({
  churches: {},
  users: {},
  userChurchMemberships: {},
  db: {
    update: () => ({
      set: (data: Record<string, unknown>) => {
        mockCaptured.push(data)
        return {
          where: () => ({
            returning: async () => [{ id: 'church-a', ...data }],
          }),
        }
      },
    }),
  },
}))

import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { ChurchService } from './churches.service'
import { UpdateChurchDto } from './dtos/update-church.dto'

async function validateBody(body: Record<string, unknown>) {
  const instance = plainToInstance(UpdateChurchDto, body)
  return validate(instance, { whitelist: true, forbidNonWhitelisted: true })
}

describe('UpdateChurchDto (RM-013)', () => {
  it('rejects networkId as a non-whitelisted field', async () => {
    const errors = await validateBody({ name: 'Mito', networkId: '00000000-0000-0000-0000-000000000000' })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.flatMap((e) => Object.keys(e.constraints ?? {}))).toContain('whitelistValidation')
  })

  it.each(['id', 'deletedAt', 'createdAt', 'updatedAt'])('rejects %s', async (field) => {
    const errors = await validateBody({ name: 'Mito', [field]: 'x' })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('accepts a partial update of whitelisted fields', async () => {
    expect(await validateBody({ name: 'Mito Ya Baraka', phone: '+255712345678' })).toHaveLength(0)
  })

  it('rejects null or empty values for present fields', async () => {
    expect((await validateBody({ name: null })).length).toBeGreaterThan(0)
    expect((await validateBody({ name: '' })).length).toBeGreaterThan(0)
  })
})

describe('ChurchService.updateChurch field pick (RM-013)', () => {
  beforeEach(() => {
    mockCaptured.length = 0
  })

  it('writes only whitelisted fields even when extra keys are passed in', async () => {
    const service = new ChurchService()
    await service.updateChurch('church-a', {
      name: 'Renamed',
      networkId: 'attacker-network',
      deletedAt: new Date(),
      id: 'other-church',
    } as any)

    expect(mockCaptured).toHaveLength(1)
    const written = mockCaptured[0]
    expect(written).toMatchObject({ name: 'Renamed' })
    expect(written).not.toHaveProperty('networkId')
    expect(written).not.toHaveProperty('id')
    expect(written).not.toHaveProperty('deletedAt')
  })
})
