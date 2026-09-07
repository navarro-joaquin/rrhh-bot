import { AppConfigService } from '../config/app-config.service';
import { BotTokenProviderService } from './bot-token-provider.service';
import { RrhhApiService } from './rrhh-api.service';

describe('RrhhApiService', () => {
  const config = {
    rrhhApiUrl: 'https://rrhh.test',
    rrhhBotClientSecret: 'client-secret',
    requestTimeoutMs: 1000,
  } as unknown as AppConfigService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let service: RrhhApiService;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    const tokenProvider = new BotTokenProviderService(config);
    service = new RrhhApiService(config, tokenProvider);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('obtiene el token automáticamente antes de consultar Laravel', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            id: 7,
            nombre_completo: 'Ana Pérez',
            telefono: '70001001',
            contrato_vigente: null,
          },
        }),
      );

    await expect(
      service.getEmpleadoPorTelefono('59170001001@s.whatsapp.net'),
    ).resolves.toEqual(expect.objectContaining({ id: 7 }));

    const [tokenUrl, tokenRequest] = fetchMock.mock.calls[0];
    const [apiUrl, apiRequest] = fetchMock.mock.calls[1];

    expect(tokenUrl).toBe('https://rrhh.test/api/v1/bot/auth/token');
    expect(tokenRequest?.method).toBe('POST');
    expect(new Headers(tokenRequest?.headers).get('X-Bot-Client-Secret')).toBe(
      'client-secret',
    );
    expect(typeof apiUrl).toBe('string');
    if (typeof apiUrl !== 'string') {
      throw new Error('La URL de la consulta debe ser una cadena.');
    }
    expect(apiUrl).toContain('empleados/por-telefono');
    expect(new Headers(apiRequest?.headers).get('Authorization')).toBe(
      'Bearer token-1',
    );
  });

  it('reutiliza el token mientras permanece vigente', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse({}, 404));

    await service.getEmpleadoPorTelefono('70001001');
    await service.getEmpleadoPorTelefono('70001002');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const thirdRequest = fetchMock.mock.calls[2][1];
    expect(new Headers(thirdRequest?.headers).get('Authorization')).toBe(
      'Bearer token-1',
    );
  });

  it('renueva el token y reintenta una vez cuando Laravel responde 401', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('token-vencido'))
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(tokenResponse('token-nuevo'))
      .mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(
      service.getEmpleadoPorTelefono('70001001'),
    ).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const retryRequest = fetchMock.mock.calls[3][1];
    expect(new Headers(retryRequest?.headers).get('Authorization')).toBe(
      'Bearer token-nuevo',
    );
  });
});

function tokenResponse(token: string): Response {
  return jsonResponse({
    data: {
      access_token: token,
      token_type: 'Bearer',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
