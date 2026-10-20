import { Category } from '../models/category.model';
import { Report, ReportPriority, ReportStatus } from '../models/report.model';
import { User } from '../models/user.model';

/** Datos ficticios de la demo pública. Equivalen a backend/db/seed.sql. */
export const DEMO_PASSWORD = 'Nexo123!';

const UTMACH = 'org-utmach';
const TECHCORP = 'org-techcorp';

export const DEMO_USERS: User[] = [
  { id: 'u-carlos', organizationId: UTMACH, organizationSlug: 'utmach', name: 'Carlos Mendoza (Estudiante)', email: 'user@example.test', role: 'USER' },
  { id: 'u-maria', organizationId: UTMACH, organizationSlug: 'utmach', name: 'Ing. María Rodríguez (Docente)', email: 'maria.rodriguez@utmach.edu.ec', role: 'USER' },
  { id: 't-roberto', organizationId: UTMACH, organizationSlug: 'utmach', name: 'Roberto Sánchez (Técnico Hardware)', email: 'tech@example.test', role: 'TECHNICIAN' },
  { id: 't-andrea', organizationId: UTMACH, organizationSlug: 'utmach', name: 'Andrea Jaramillo (Técnico Redes)', email: 'andrea.jaramillo@utmach.edu.ec', role: 'TECHNICIAN' },
  { id: 'u-david', organizationId: TECHCORP, organizationSlug: 'techcorp', name: 'David Pérez (Frontend Dev)', email: 'david.perez@techcorp.io', role: 'USER' },
  { id: 't-alex', organizationId: TECHCORP, organizationSlug: 'techcorp', name: 'Alex Valdez (DevOps)', email: 'alex.valdez@techcorp.io', role: 'TECHNICIAN' }
];

export const DEMO_CATEGORIES: (Category & { organizationId: string })[] = [
  { id: 'c-comp', organizationId: UTMACH, code: 'COMPUTER', name: 'Equipos informáticos', active: true },
  { id: 'c-net', organizationId: UTMACH, code: 'NETWORK', name: 'Redes y conectividad', active: true },
  { id: 'c-soft', organizationId: UTMACH, code: 'SOFTWARE', name: 'Software y licencias', active: true },
  { id: 'c-print', organizationId: UTMACH, code: 'PRINTER', name: 'Impresoras y periféricos', active: true },
  { id: 'c-tc-comp', organizationId: TECHCORP, code: 'COMPUTER', name: 'Hardware y laptops', active: true },
  { id: 'c-tc-net', organizationId: TECHCORP, code: 'NETWORK', name: 'Servidores y redes', active: true }
];

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function report(
  id: string,
  organizationId: string,
  title: string,
  description: string,
  categoryId: string,
  priority: ReportPriority,
  status: ReportStatus,
  reporterId: string,
  technicianId: string | null,
  createdMinutesAgo: number,
  updatedMinutesAgo: number,
  resolutionNotes: string | null = null
): Report {
  return {
    id, organizationId, title, description, categoryId, priority, status, reporterId, technicianId, resolutionNotes,
    categoryCode: '', categoryName: '', reporterName: '', technicianName: null,
    createdAt: minutesAgo(createdMinutesAgo), updatedAt: minutesAgo(updatedMinutesAgo)
  };
}

export function seedReports(): Report[] {
  return [
    report('r-1', UTMACH, 'Pérdida de conectividad WiFi en el edificio central',
      'Los estudiantes del aula 204 no pueden conectarse al punto de acceso institucional desde las 08:00.',
      'c-net', 'HIGH', 'IN_PROGRESS', 'u-carlos', 't-andrea', 120, 60),
    report('r-2', UTMACH, 'Pantalla azul en laboratorio 3, estación 12',
      'El computador se reinicia aleatoriamente al ejecutar aplicaciones pesadas como MATLAB.',
      'c-comp', 'MEDIUM', 'OPEN', 'u-carlos', null, 30, 30),
    report('r-3', UTMACH, 'Impresora del decanato no reconoce el tóner',
      'La HP LaserJet muestra error de falta de tóner aunque se insertó un cartucho nuevo.',
      'c-print', 'LOW', 'RESOLVED', 'u-maria', 't-roberto', 1440, 180,
      'Se limpiaron los contactos del sensor de tóner y se imprimió una página de prueba correctamente.'),
    report('r-4', UTMACH, 'Licencia expirada del software estadístico',
      'Se requiere renovar la clave de producto para las 30 estaciones del laboratorio de investigación.',
      'c-soft', 'CRITICAL', 'OPEN', 'u-maria', null, 10, 10),
    report('r-5', UTMACH, 'Proyector del aula 105 sin señal HDMI',
      'El proyector enciende pero no detecta la laptop del docente con ningún cable.',
      'c-comp', 'HIGH', 'OPEN', 'u-carlos', 't-roberto', 300, 240),
    report('r-6', TECHCORP, 'Servidor de staging fuera de servicio',
      'El contenedor de base de datos de staging colapsó por falta de espacio en disco.',
      'c-tc-net', 'CRITICAL', 'RESOLVED', 'u-david', 't-alex', 300, 120,
      'Se limpiaron los logs con docker system prune y se amplió el volumen en 50 GB.')
  ];
}
