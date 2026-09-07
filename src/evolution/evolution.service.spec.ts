import { AppConfigService } from '../config/app-config.service';
import { EvolutionService } from './evolution.service';

describe('EvolutionService', () => {
  const config = {
    evolutionApiUrl: 'http://localhost:7777',
    evolutionApiKey: 'evolution-key',
    evolutionInstance: 'RRHH',
    requestTimeoutMs: 1000,
  } as unknown as AppConfigService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response());
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('envía a Evolution solamente el número internacional, sin el sufijo JID', async () => {
    const service = new EvolutionService(config);

    await service.sendText('59173432404@s.whatsapp.net', 'Mensaje de prueba');

    const [url, request] = fetchMock.mock.calls[0];

    expect(url).toBe('http://localhost:7777/message/sendText/RRHH');
    expect(request?.body).toBe(
      JSON.stringify({
        number: '59173432404',
        text: 'Mensaje de prueba',
      }),
    );
  });
});
