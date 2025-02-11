<script>
import { TYPES } from '@/models/secret';
import { NAMESPACE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import CruResource from '@/components/CruResource';
import { CLOUD_CREDENTIAL, _CREATE, _EDIT, _FLAGGED } from '@/config/query-params';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Labels from '@/components/form/Labels';
import { HIDE_SENSITIVE } from '@/store/prefs';
import { CAPI } from '@/config/labels-annotations';
import { clear } from '@/utils/array';
import { importCloudCredential } from '@/utils/dynamic-importer';
import { NAME as MANAGER } from '@/config/product/manager';

const creatableTypes = [
  TYPES.OPAQUE,
  TYPES.DOCKER_JSON,
  TYPES.TLS,
  TYPES.SSH,
  TYPES.BASIC,
];

export default {
  name: 'CruSecret',

  components: {
    NameNsDescription,
    CruResource,
    Tabbed,
    Tab,
    Labels
  },

  mixins: [CreateEditView],

  data() {
    const newCloudCred = this.$route.query[CLOUD_CREDENTIAL] === _FLAGGED;
    const editCloudCred = this.mode === _EDIT && this.value._type === TYPES.CLOUD_CREDENTIAL;
    const isCloud = newCloudCred || editCloudCred;

    if ( newCloudCred ) {
      this.value.metadata.namespace = 'fleet-default';
    }

    return { isCloud };
  },

  computed: {
    typeKey() {
      if ( this.isCloud ) {
        return 'cloud';
      }

      switch ( this.value._type ) {
      case TYPES.TLS: return 'tls';
      case TYPES.BASIC: return 'basic';
      case TYPES.DOCKER_JSON: return 'registry';
      case TYPES.SSH: return 'ssh';
      }

      return 'generic';
    },

    dataComponent() {
      return require(`@/edit/secret/${ this.typeKey }`).default;
    },

    cloudComponent() {
      const driver = this.value.metadata?.annotations?.[CAPI.CREDENTIAL_DRIVER];

      return importCloudCredential(driver);
    },

    // array of id, label, description, initials for type selection step
    secretSubTypes() {
      const out = [];

      // Cloud credentials
      if ( this.isCloud ) {
        for ( const id of this.$store.getters['plugins/credentialDrivers'] ) {
          const label = this.$store.getters['i18n/withFallback'](`cluster.provider."${ id }"`, id);
          const bannerAbbrv = label.replace(/[^A-Z]/g, '') || label.substr(0, 4);

          out.push({
            id, label, bannerAbbrv
          });
        }
      }

      // Other kinds
      for ( const type of creatableTypes ) {
        out.push({
          id:          type,
          label:       this.typeDisplay(type),
          bannerAbbrv: this.initialDisplayFor(type)
        });
      }

      return out;
    },

    namespaces() {
      return this.$store.getters['cluster/all'](NAMESPACE).map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });
    },

    hideSensitiveData() {
      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },

    dataLabel() {
      switch (this.value._type) {
      case TYPES.TLS:
        return this.t('secret.certificate.certificate');
      case TYPES.SSH:
        return this.t('secret.ssh.keys');
      case TYPES.BASIC:
        return this.t('secret.authentication');
      default:
        return this.t('secret.data');
      }
    },

    doneRoute() {
      if ( this.$store.getters['currentProduct'].name === MANAGER ) {
        return 'c-cluster-manager-secret';
      } else {
        return 'c-cluster-product-resource';
      }
    },
  },

  methods: {
    async saveSecret(btnCb) {
      if ( this.errors ) {
        clear(this.errors);
      }

      if ( typeof this.$refs.cloudComponent?.test === 'function' ) {
        try {
          const res = await this.$refs.cloudComponent.test();

          if ( !res ) {
            this.errors = ['Authentication test failed, please check your credentials'];
            btnCb(false);

            return;
          }
        } catch (e) {
          this.errors = [e];
          btnCb(false);

          return;
        }
      }

      return this.save(btnCb);
    },

    selectType(type) {
      if ( this.isCloud ) {
        this.$set(this.value, '_type', TYPES.CLOUD_CREDENTIAL);
        if ( this.mode === _CREATE ) {
          this.value.setAnnotation(CAPI.CREDENTIAL_DRIVER, type);
        }
      } else {
        this.$set(this.value, '_type', type);
      }

      this.$emit('set-subtype', this.typeDisplay(type));
    },

    typeDisplay(type) {
      const fallback = type.replace(/^kubernetes.io\//, '');

      return this.$store.getters['i18n/withFallback'](`secret.types."${ type }"`, null, fallback);
    },

    initialDisplayFor(type) {
      const fallback = (this.typeDisplay(type) || '').replace(/[^A-Z]/g, '') || type;

      return this.$store.getters['i18n/withFallback'](`secret.initials."${ type }"`, null, fallback);
    },
  },
};
</script>

<template>
  <form>
    <CruResource
      :mode="mode"
      :validation-passed="true"
      :selected-subtype="value._type"
      :resource="value"
      :errors="errors"
      :done-route="doneRoute"
      :subtypes="secretSubTypes"
      @finish="saveSecret"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <NameNsDescription v-model="value" :mode="mode" :namespaced="!isCloud" />

      <div class="spacer"></div>
      <component
        :is="cloudComponent"
        v-if="isCloud"
        ref="cloudComponent"
        :value="value"
        :mode="mode"
        :hide-sensitive-data="hideSensitiveData"
      />
      <Tabbed v-else :side-tabs="true" default-tab="data">
        <Tab name="data" :label="dataLabel">
          <component
            :is="dataComponent"
            :value="value"
            :mode="mode"
            :hide-sensitive-data="hideSensitiveData"
          />
        </Tab>
        <Tab name="labels" :label="t('generic.labelsAndAnnotations')">
          <Labels v-model="value" :mode="mode" />
        </Tab>
      </Tabbed>
    </CruResource>
  </form>
</template>

<style lang='scss'>
</style>
