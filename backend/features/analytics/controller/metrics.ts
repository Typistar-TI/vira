import { siteMetrics } from '../service/metrics';
import { emptyReport } from '../entities/metrics';
import { getSiteForUser } from '@backend/features/sites/repository/sites';
import { isResponse, json, requireUser } from '@backend/platform/http';

const allowedDays = [7, 30, 90];

export const GET = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const param = Number(new URL(request.url).searchParams.get('days'));
  const days = allowedDays.includes(param) ? param : 30;
  const site = await getSiteForUser(user.id);
  if (!site) return json(emptyReport(days));
  return json(await siteMetrics(site.id, days));
};
