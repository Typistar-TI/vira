import { siteMetrics } from '../service/metrics';
import { getSiteForUser } from '@backend/features/sites/repository/sites';
import { isResponse, json, requireUser } from '@backend/platform/http';

export const GET = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  if (!site) return json({ views: 0, clicks: 0 });
  return json(await siteMetrics(site.id));
};
