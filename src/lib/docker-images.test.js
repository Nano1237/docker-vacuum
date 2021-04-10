const { parseResponse, parseLine } = require('./docker-images');
const { r1, r2, r4 } = require('./docker-images.fixture');

describe('lib/docker-images', () => {
  test('parseResponse should parse lines', async () => {
    const res = parseResponse(r1);
    expect(res.length).toEqual(162);
  });

  test('parseLine should work', () => {
    const res = parseLine(r2);
    expect(res.uuid).toBe('6a23819b932c');
    expect(res.size.string).toBe('895MB');
  });

  test('should parse r4', () => {
    const res = parseResponse(r4);
  });
});
