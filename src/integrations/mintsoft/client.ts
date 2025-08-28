import { AxiosInstance } from 'axios';
import { z } from 'zod';
import { env } from '../../config/env';
import { CourierService, MintsoftOrder, OrderStatus } from './types';
import { logger } from '../../lib/logger';
import { createMintsoftHttp } from '../../lib/mintsoft/client';

// Orders: use a lightweight normalizer based on observed Mintsoft payload keys
function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeOrder(raw: any): MintsoftOrder {
  const id = raw.ID ?? raw.Id ?? raw.OrderID ?? raw.OrderId;
  const statusId = raw.OrderStatusId ?? raw.StatusId;
  const courierId = raw.CourierServiceId ?? raw.CourierServiceTypeId ?? null;
  const channelName = typeof raw.Channel === 'object' && raw.Channel
    ? (raw.Channel.Name ?? raw.Channel.ExternalName ?? '')
    : (raw.Channel ?? '');
  const customerName = raw.CompanyName
    ? String(raw.CompanyName)
    : [raw.FirstName, raw.LastName].filter(Boolean).join(' ').trim();
  const countryCode = raw.Country && typeof raw.Country === 'object'
    ? (raw.Country.Code ?? raw.Country.ISO ?? '')
    : (raw.CountryCode ?? '');

  return {
    OrderId: Number(id),
    OrderStatusId: Number(statusId),
    CourierServiceId: courierId != null ? Number(courierId) : null,
    OrderNumber: raw.OrderNumber ?? undefined,
    Channel: channelName || undefined,
    CustomerName: customerName || undefined,
    Address1: raw.Address1 ?? undefined,
    Address2: (raw.Address2 ?? raw.Address3) || undefined,
    City: raw.Town ?? undefined,
    Postcode: raw.PostCode ?? undefined,
    CountryCode: countryCode || undefined,
    Weight: toNumberOrNull(raw.TotalWeight),
    CreatedDate: raw.OrderDate ?? undefined,
  } as MintsoftOrder;
}

// Tolerant schemas: normalize alternative Mintsoft shapes to { Id, Name }
const StatusRawSchema = z
  .object({
    Id: z.number().optional(),
    StatusId: z.number().optional(),
    OrderStatusId: z.number().optional(),
    ID: z.number().optional(),
    Name: z.string().optional(),
    StatusName: z.string().optional(),
    OrderStatusName: z.string().optional(),
  })
  .superRefine((obj, ctx) => {
    if (obj.Id == null && obj.StatusId == null && obj.OrderStatusId == null && obj.ID == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Missing Id/StatusId' });
    }
    if (obj.Name == null && obj.StatusName == null && obj.OrderStatusName == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Missing Name/StatusName' });
    }
  })
  .transform((obj) => ({ Id: (obj.Id ?? obj.StatusId ?? obj.OrderStatusId ?? obj.ID) as number, Name: (obj.Name ?? obj.StatusName ?? obj.OrderStatusName) as string }));

const CourierRawSchema = z
  .object({
    Id: z.number().optional(),
    ServiceId: z.number().optional(),
    CourierServiceId: z.number().optional(),
    ID: z.number().optional(),
    Name: z.string().optional(),
    ServiceName: z.string().optional(),
  })
  .superRefine((obj, ctx) => {
    if (obj.Id == null && obj.ServiceId == null && obj.CourierServiceId == null && obj.ID == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Missing Id/ServiceId' });
    }
    if (obj.Name == null && obj.ServiceName == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Missing Name/ServiceName' });
    }
  })
  .transform((obj) => ({ Id: (obj.Id ?? obj.ServiceId ?? obj.CourierServiceId ?? obj.ID) as number, Name: (obj.Name ?? obj.ServiceName) as string }));

export class MintsoftClient {
  private http: AxiosInstance;

  constructor() {
    this.http = createMintsoftHttp({
      baseURL: env.MINTSOFT_API_URL,
      apiKey: env.MINTSOFT_API_KEY,
    });
  }

  async getOrders(): Promise<MintsoftOrder[]> {
    const res = await this.http.get('/api/Order/List');
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(normalizeOrder);
  }

  async getStatuses(): Promise<OrderStatus[]> {
    const res = await this.http.get('/api/Order/Statuses');
    return z.array(StatusRawSchema).parse(res.data) as OrderStatus[];
  }

  async getCourierServices(): Promise<CourierService[]> {
    const res = await this.http.get('/api/Courier/Services');
    return z.array(CourierRawSchema).parse(res.data) as CourierService[];
  }
}
