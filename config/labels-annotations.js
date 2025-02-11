export const NORMAN_NAME = 'field.cattle.io/name';
export const DESCRIPTION = 'field.cattle.io/description';
export const HOSTNAME = 'kubernetes.io/hostname';
export const TIMESTAMP = 'cattle.io/timestamp';
export const SYSTEM_NAMESPACE = 'management.cattle.io/system-namespace';
export const PROJECT = 'field.cattle.io/projectId';
export const SYSTEM_PROJECT = 'authz.management.cattle.io/system-project';
export const CONTAINER_DEFAULT_RESOURCE_LIMIT = 'field.cattle.io/containerDefaultResourceLimit';
export const CATTLE_PUBLIC_ENDPOINTS = 'field.cattle.io/publicEndpoints';
export const TARGET_WORKLOADS = 'field.cattle.io/targetWorkloadIds';
export const UI_MANAGED = 'management.cattle.io/ui-managed';

export const KUBERNETES = {
  SERVICE_ACCOUNT_UID:  'kubernetes.io/service-account.uid',
  SERVICE_ACCOUNT_NAME: 'kubernetes.io/service-account.name',
  MANAGED_BY:           'app.kubernetes.io/managed-by',
  MANAGED_NAME:         'app.kubernetes.io/name',
  INSTANCE:             'app.kubernetes.io/instance',
};

export const RIO = { STACK: 'rio.cattle.io/stack' };

export const CERTMANAGER = { ISSUER: 'cert-manager.io/issuer-name' };

export const STORAGE = {
  DEFAULT_STORAGE_CLASS:      'storageclass.kubernetes.io/is-default-class',
  BETA_DEFAULT_STORAGE_CLASS: 'storageclass.beta.kubernetes.io/is-default-class'
};

export const NODE_ROLES = {
  CONTROL_PLANE: 'node-role.kubernetes.io/controlplane',
  WORKER:        'node-role.kubernetes.io/worker',
  ETCD:          'node-role.kubernetes.io/etcd',
};

export const CAPI = {
  DEPLOYMENT_NAME:   'cluster.x-k8s.io/deployment-name',
  CREDENTIAL_DRIVER: 'provisioning.cattle.io/driver',
};

export const CATALOG = {
  CERTIFIED:     'catalog.cattle.io/certified',
  _RANCHER:      'rancher',
  _PARTNER:      'partner',
  _OTHER:         'other',

  EXPERIMENTAL:  'catalog.cattle.io/experimental',
  NAMESPACE:     'catalog.cattle.io/namespace',
  RELEASE_NAME:  'catalog.cattle.io/release-name',

  REQUIRES_GVK:     'catalog.cattle.io/requires-gvr',
  PROVIDES:         'catalog.cattle.io/provides-gvr',
  AUTO_INSTALL_GVK: 'catalog.cattle.io/auto-install-gvr',
  AUTO_INSTALL:     'catalog.cattle.io/auto-install',
  HIDDEN:           'catalog.cattle.io/hidden',
  REQUESTS_CPU:     'catalog.cattle.io/requests-cpu',
  REQUESTS_MEMORY:  'catalog.cattle.io/requests-memory',

  SCOPE:            'catalog.cattle.io/scope',
  _MANAGEMENT:      'management',
  _DOWNSTREAM:      'downstream',

  COMPONENT:        'catalog.cattle.io/ui-component',
  SOURCE_REPO_TYPE: 'catalog.cattle.io/ui-source-repo-type',
  SOURCE_REPO_NAME: 'catalog.cattle.io/ui-source-repo',
  COLOR:            'catalog.cattle.io/ui-color',
  DISPLAY_NAME:     'catalog.cattle.io/display-name',

  SUPPORTED_OS: 'catalog.cattle.io/os',
};

export const FLEET = {
  CLUSTER_DISPLAY_NAME: 'management.cattle.io/cluster-display-name',
  CLUSTER_NAME:         'management.cattle.io/cluster-name',
  BUNDLE_ID:            'fleet.cattle.io/bundle-id',
};

export const RBAC = { PRODUCT: 'management.cattle.io/ui-product' };

export const RKE = { EXTERNAL_IP: 'rke.cattle.io/external-ip' };

export const ISTIO = { AUTO_INJECTION: 'istio-injection' };

const CATTLE_REGEX = /cattle\.io\//;

export const LABELS_TO_IGNORE_REGEX = [
  CATTLE_REGEX
];

export const ANNOTATIONS_TO_IGNORE_REGEX = [
  CATTLE_REGEX
];

export const ANNOTATIONS_TO_FOLD = [
  /^kubectl\.kubernetes\.io\/.*$/,
  /^objectset\.rio\.cattle\.io\/.*$/,
];
