<script>
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: { Checkbox, LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    provider() {
      return this.currentCluster.status.provider;
    }
  },

  created() {
    let provider = this.provider;

    if ( provider.startsWith('rke.') ) {
      provider = 'rke';
    }

    this.$set(this.value, 'additionalLoggingSources', this.value.additionalLoggingSources || {});
    this.$set(this.value.additionalLoggingSources, provider, this.value.additionalLoggingSources[provider] || {});
    this.$set(this.value.additionalLoggingSources[provider], 'enabled', true);
    this.$set(this.value, 'global', this.value.global || {});
  },
};
</script>

<template>
  <div class="logging">
    <div v-if="provider === 'k3s'" class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.additionalLoggingSources.k3s.container_engine" :label="t('logging.install.k3sContainerEngine')" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.global.dockerRootDirectory" :label="t('logging.install.dockerRootDirectory')" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <Checkbox v-model="value.additionalLoggingSources[provider].enabled" :label="t('logging.install.enableAdditionalLoggingSources')" />
      </div>
    </div>
  </div>
</template>
