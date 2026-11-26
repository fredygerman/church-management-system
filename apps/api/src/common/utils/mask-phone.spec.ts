import { maskPhone } from './mask-phone';

describe('maskPhone', () => {
  it('keeps the country prefix and last three digits', () => {
    expect(maskPhone('+255712345678')).toBe('+255***678');
  });

  it('ignores spaces and dashes when masking', () => {
    expect(maskPhone('+255 712-345-123')).toBe('+255***123');
  });

  it('fully masks short, empty or missing input', () => {
    expect(maskPhone('12345')).toBe('***');
    expect(maskPhone('')).toBe('***');
    expect(maskPhone(undefined)).toBe('***');
    expect(maskPhone(null)).toBe('***');
  });
});
