import { EvolutionService } from '../evolution/evolution.service';
import { RrhhApiService } from '../rrhh-api/rrhh-api.service';
import { Empleado } from '../rrhh-api/rrhh-api.types';
import { BotService } from './bot.service';

describe('BotService', () => {
  const empleado: Empleado = {
    id: 7,
    nombre_completo: 'Ana Pérez',
    telefono: '70001001',
    contrato_vigente: {
      id: 4,
      nro_item: 'ITEM-10',
      tipo: 'Indefinido',
    },
  };

  const rrhhApi = {
    getEmpleadoPorTelefono: jest.fn(),
    getVacaciones: jest.fn(),
    getCompensaciones: jest.fn(),
    getSolicitudesVacaciones: jest.fn(),
    getRegistrosCompensaciones: jest.fn(),
  };
  const evolution = { sendText: jest.fn() };
  let service: BotService;

  beforeEach(() => {
    jest.resetAllMocks();
    rrhhApi.getEmpleadoPorTelefono.mockResolvedValue(empleado);
    evolution.sendText.mockResolvedValue(undefined);
    service = new BotService(
      rrhhApi as unknown as RrhhApiService,
      evolution as unknown as EvolutionService,
    );
  });

  it('informa cuando el teléfono no pertenece a un empleado activo', async () => {
    rrhhApi.getEmpleadoPorTelefono.mockResolvedValue(null);

    await service.handle('59170000000@s.whatsapp.net', 'hola');

    expect(evolution.sendText).toHaveBeenCalledWith(
      '59170000000@s.whatsapp.net',
      expect.stringContaining('no está registrado'),
    );
  });

  it('muestra el menú ante un mensaje que no es una opción', async () => {
    await service.handle('70001001', 'hola');

    expect(evolution.sendText).toHaveBeenCalledWith(
      '70001001',
      expect.stringContaining('Nombre: Ana Pérez'),
    );
    expect(evolution.sendText).toHaveBeenCalledWith(
      '70001001',
      expect.stringContaining('Ítem: ITEM-10'),
    );
  });

  it('consulta y muestra las vacaciones disponibles', async () => {
    rrhhApi.getVacaciones.mockResolvedValue({
      data: [
        {
          gestion: 2026,
          dias_disponibles: 12.5,
          dias: 12,
          horas: 4,
          minutos: 0,
          texto: '12 días y 4 horas',
        },
      ],
      meta: {
        total_dias_disponibles: 12.5,
        total_dias: 12,
        total_horas: 4,
        total_minutos: 0,
        total_texto: '12 días y 4 horas',
      },
    });

    await service.handle('70001001', '1');

    expect(rrhhApi.getVacaciones).toHaveBeenCalledWith(7);
    expect(evolution.sendText).toHaveBeenCalledWith(
      '70001001',
      expect.stringContaining('Total: *12 días y 4 horas*'),
    );
  });

  it('usa el formato decimal cuando la api no envia el desglose', async () => {
    rrhhApi.getVacaciones.mockResolvedValue({
      data: [{ gestion: 2026, dias_disponibles: 12.5 }],
      meta: { total_dias_disponibles: 12.5 },
    });

    await service.handle('70001001', '1');

    expect(evolution.sendText).toHaveBeenCalledWith(
      '70001001',
      expect.stringContaining('Total: *12.5 días*'),
    );
  });

  it('consulta y muestra las compensaciones disponibles', async () => {
    rrhhApi.getCompensaciones.mockResolvedValue({
      data: [],
      meta: {
        total_horas_disponibles: 4.5,
        total_horas: 4,
        total_minutos: 30,
        total_texto: '4 horas y 30 minutos',
      },
    });

    await service.handle('70001001', '2');

    expect(rrhhApi.getCompensaciones).toHaveBeenCalledWith(7);
    expect(evolution.sendText).toHaveBeenCalledWith(
      '70001001',
      expect.stringContaining('Horas disponibles: *4 horas y 30 minutos*'),
    );
  });

  it('muestra fechas, días y estado de solicitudes de vacaciones', async () => {
    rrhhApi.getSolicitudesVacaciones.mockResolvedValue({
      data: [
        {
          id: 1,
          fecha_inicio: '2026-09-10',
          fecha_fin: '2026-09-12',
          dias_solicitados: 2,
          dias: 2,
          horas: 0,
          minutos: 0,
          texto: '2 días',
          estado: 'aprobado',
        },
      ],
    });

    await service.handle('70001001', '3');

    expect(evolution.sendText).toHaveBeenCalledWith(
      '70001001',
      expect.stringContaining(
        '10/09/2026 - 12/09/2026 por 2 días. Estado: aprobado.',
      ),
    );
  });

  it('muestra los movimientos de compensación', async () => {
    rrhhApi.getRegistrosCompensaciones.mockResolvedValue({
      data: [
        {
          id: 2,
          gestion: 2026,
          mes: 9,
          fecha: '2026-09-15',
          tipo: 'uso',
          horas: 3,
          horas_desglose: 3,
          minutos: 0,
          texto: '3 horas',
          descripcion: 'Uso de prueba',
        },
      ],
    });

    await service.handle('70001001', '4');

    expect(evolution.sendText).toHaveBeenCalledWith(
      '70001001',
      expect.stringContaining('15/09/2026 - 3 horas (uso). Uso de prueba.'),
    );
  });
});
