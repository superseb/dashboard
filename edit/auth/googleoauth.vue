<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import AuthConfig from '@/mixins/auth-config';

import CruResource from '@/components/CruResource';
import InfoBox from '@/components/InfoBox';
import Checkbox from '@/components/form/Checkbox';
import LabeledInput from '@/components/form/LabeledInput';
import Banner from '@/components/Banner';
import AllowedPrincipals from '@/components/auth/AllowedPrincipals';
import FileSelector from '@/components/form/FileSelector';
import AuthBanner from '@/components/auth/AuthBanner';
import CopyToClipboardText from '@/components/CopyToClipboardText';

const NAME = 'googleoauth';

export default {
  components: {
    Loading,
    CruResource,
    InfoBox,
    LabeledInput,
    Banner,
    Checkbox,
    AllowedPrincipals,
    FileSelector,
    AuthBanner,
    CopyToClipboardText
  },

  mixins: [CreateEditView, AuthConfig],

  computed: {
    tArgs() {
      let hostname = '';

      if (process.client) {
        hostname = window.location.hostname;
      }

      return {
        hostname,
        serverUrl: this.serverUrl,
        provider:  this.displayName,
        username:  this.principal.loginName || this.principal.name,
      };
    },

    NAME() {
      return NAME;
    },

    toSave() {
      return {
        enabled:           true,
        googleOauthConfig: this.model,
        description:       'Enable Google OAuth',
      };
    }
  },

  created() {
    this.registerBeforeHook(this.addCreds, 'willsave');
  },
  methods: {
    // re-add credentials when adding allowed users/groups to model
    addCreds() {
      if (this.model.enabled) {
        const { oauthCredential, serviceAccountCredential } = this.originalValue;

        if (!this.model.oauthCredential) {
          this.model.oauthCredential = oauthCredential;
        }
        if (!this.model.serviceAccountCredential) {
          this.model.serviceAccountCredential = serviceAccountCredential;
        }
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <CruResource
      :cancel-event="true"
      :done-route="doneRoute"
      :mode="mode"
      :resource="model"
      :subtypes="[]"
      :validation-passed="true"
      :finish-button-mode="model.enabled ? 'edit' : 'enable'"
      :can-yaml="false"
      :errors="errors"
      :show-cancel="showCancel"
      @error="e=>errors = e"
      @finish="save"
      @cancel="cancel"
    >
      <template v-if="model.enabled && !isEnabling && !editConfig">
        <AuthBanner :t-args="tArgs" :disable="disable" :edit="goToEdit">
          <template slot="rows">
            <tr><td>{{ t(`authConfig.${NAME}.adminEmail`) }}: </td><td>{{ model.adminEmail }}</td></tr>
            <tr><td>{{ t(`authConfig.${NAME}.domain`) }}: </td><td>{{ model.hostname }}</td></tr>

            <tr><td>{{ t('authConfig.ldap.nestedGroupMembership.label') }}: </td><td>{{ model.nestedGroupMembershipEnabled ? t('generic.enabled') : t('generic.disabled') }}</td></tr>
          </template>
        </AuthBanner>

        <hr />

        <AllowedPrincipals provider="googleoauth" :auth-config="model" :mode="mode" />
      </template>

      <template v-else>
        <Banner v-if="!model.enabled" :label="t('authConfig.stateBanner.disabled', tArgs)" color="warning" />
        <div :style="{'align-items':'center'}" class="row mb-20">
          <div class="col span-5">
            <LabeledInput
              v-model="model.adminEmail"
              :label="t(`authConfig.${NAME}.adminEmail`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-5">
            <LabeledInput
              v-model="model.hostname"
              :label="t(`authConfig.${NAME}.domain`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-2">
            <Checkbox v-model="model.nestedGroupMembershipEnabled" :mode="mode" :label="t('authConfig.ldap.nestedGroupMembership.label')" />
          </div>
        </div>
        <InfoBox :step="1" class=" mt-20 mb-20">
          <h3 v-html="t('authConfig.googleoauth.steps.1.title', tArgs, true)" />
          <ul class="mt-0 step-list">
            <li>{{ t('authConfig.googleoauth.steps.1.body.1', {}, true) }} </li>
            <li><b>{{ t('authConfig.googleoauth.steps.1.body.2', {}, true) }}</b> {{ t('authConfig.googleoauth.steps.1.topPrivateDomain', {}, true) }} <CopyToClipboardText :plain="true" :text="tArgs.hostname" /> </li>
            <li><b>{{ t('authConfig.googleoauth.steps.1.body.3', {}, true) }}</b> <CopyToClipboardText :plain="true" :text="serverUrl" /> </li>
            <li>{{ t('authConfig.googleoauth.steps.1.body.4', {}, true) }} </li>
            <li>{{ t('authConfig.googleoauth.steps.1.body.5', {}, true) }} </li>
          </ul>
        </InfoBox>
        <InfoBox :step="2" class="mb-20">
          <div class="row">
            <h3 v-html="t('authConfig.googleoauth.steps.2.title', tArgs, true)" />
          </div>
          <div class="row">
            <div class="col span-6">
              <ul class="mt-0 step-list">
                <li>{{ t('authConfig.googleoauth.steps.2.body.1', {}, true) }} </li>
                <li><b>{{ t('authConfig.googleoauth.steps.2.body.2', {}, true) }}</b> <CopyToClipboardText :plain="true" :text="serverUrl" /> </li>
                <li><b>{{ t('authConfig.googleoauth.steps.2.body.3', {}, true) }}</b> <CopyToClipboardText :plain="true" :text="serverUrl+'/verify-auth'" /> </li>
                <li>{{ t('authConfig.googleoauth.steps.2.body.4', {}, true) }} </li>
                <li>{{ t('authConfig.googleoauth.steps.2.body.5', {}, true) }} </li>
              </ul>
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="model.oauthCredential"
                :label="t(`authConfig.googleoauth.oauthCredentials.label`)"
                :mode="mode"
                required
                type="multiline-password"
                :tooltip="t(`authConfig.googleoauth.oauthCredentials.tip`)"
                :hover-tooltip="true"
              />
              <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :mode="mode" @selected="$set(model, 'oauthCredential', $event)" />
            </div>
          </div>
        </InfoBox>
        <InfoBox :step="3" class="mb-20">
          <div class="row">
            <h3 v-html="t('authConfig.googleoauth.steps.3.title', tArgs, true)" />
          </div>
          <div class="row">
            <div class="col span-6">
              <div v-html="t('authConfig.googleoauth.steps.3.introduction', tArgs, true)" />
              <ul class="mt-10 step-list">
                <li>{{ t('authConfig.googleoauth.steps.3.body.1', {}, true) }} </li>
                <li>{{ t('authConfig.googleoauth.steps.3.body.2', {}, true) }} </li>
                <li>{{ t('authConfig.googleoauth.steps.3.body.3', {}, true) }} </li>
              </ul>
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="model.serviceAccountCredential"
                :label="t(`authConfig.googleoauth.serviceAccountCredentials.label`)"
                :mode="mode"
                required
                type="multiline-password"
                :tooltip="t(`authConfig.googleoauth.serviceAccountCredentials.tip`)"
                :hover-tooltip="true"
              />
              <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :mode="mode" @selected="$set(model, 'serviceAccountCredential', $event)" />
            </div>
          </div>
        </InfoBox>

        <div v-if="!model.enabled" class="row">
          <div class="col span-12">
            <Banner color="info" v-html="t('authConfig.associatedWarning', tArgs, true)" />
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
<style lang="scss" scoped>
  .step-list li:not(:last-child) {
    margin-bottom: 8px;
  }
</style>
