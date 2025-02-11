import { parse as parseUrl, addParam } from '@/utils/url';

export function computeDashboardUrl(embedUrl, clusterId, params) {
  const url = parseUrl(embedUrl);
  const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${ clusterId }`;
  const prefix = `${ clusterPrefix }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/`;
  const delimiter = 'http:rancher-monitoring-grafana:80/proxy/';
  const path = url.path.split(delimiter)[1];

  let newUrl = prefix + path;

  if (url.query.viewPanel) {
    newUrl = addParam(newUrl, 'viewPanel', url.query.viewPanel);
  }
  newUrl = addParam(newUrl, 'orgId', url.query.orgId);
  newUrl = addParam(newUrl, 'kiosk', null);

  Object.entries(params).forEach((entry) => {
    newUrl = addParam(newUrl, entry[0], entry[1]);
  });

  return newUrl;
}

export async function dashboardExists(dispatch, clusterId, embedUrl) {
  const url = parseUrl(embedUrl);
  const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${ clusterId }`;
  const prefix = `${ clusterPrefix }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/`;
  const delimiter = 'http:rancher-monitoring-grafana:80/proxy/';
  const path = url.path.split(delimiter)[1];
  const uid = path.split('/')[1];
  const newUrl = `${ prefix }api/dashboards/uid/${ uid }`;

  try {
    await dispatch('cluster/request', { url: newUrl });

    return true;
  } catch (ex) {
    return false;
  }
}

export async function allDashboardsExist(dispatch, clusterId, embededUrls) {
  const existPromises = embededUrls.map(url => dashboardExists(dispatch, clusterId, url));

  return (await Promise.all(existPromises)).every(exists => exists);
}

export function queryGrafana(dispatch, clusterId, query, range, step) {
  const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${ clusterId }`;
  const url = `${ clusterPrefix }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/api/datasources/proxy/1/api/v1/query_range?query=${ query }&start=${ range.start }&end=${ range.end }&step=${ step }`;

  return dispatch('cluster/request', { url });
}

export async function hasLeader(dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (5 * 60);

  const response = await queryGrafana(dispatch, clusterId, 'max(etcd_server_has_leader)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] === '1';
}

export async function leaderChanges(dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (60 * 60);

  const response = await queryGrafana(dispatch, clusterId, 'max(etcd_server_leader_changes_seen_total)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] || 0;
}

export async function failedProposals(dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (60 * 60);

  const response = await queryGrafana(dispatch, clusterId, 'sum(etcd_server_proposals_failed_total)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] || 0;
}
