import { findBy } from '@/utils/array';
import { HCI_ALLOWED_SETTINGS } from '@/config/settings';
import SteveModel from '@/plugins/steve/steve-class';

export default class HciSetting extends SteveModel {
  get _availableActions() {
    const toFilter = ['cloneYaml', 'download', 'goToEditYaml', 'goToViewYaml', 'goToViewConfig', 'promptRemove'];
    const settingMetadata = HCI_ALLOWED_SETTINGS[this.id];

    let out = this._standardActions;

    // Some settings are not editable
    if ( settingMetadata?.readOnly || this.fromEnv ) {
      toFilter.push('goToEdit');
    }

    out = out.filter((action) => {
      return (!toFilter.includes(action.action));
    });

    // Change the label on the first action (edit)
    const editAction = out.find(action => action.action === 'goToEdit');

    if (editAction) {
      editAction.label = this.t('advancedSettings.edit.label');
    }

    return out;
  }

  get backupTagetetIsEmpty() {
    return !this.value;
  }

  get errMessage() {
    if (this.metadata?.state?.error === true) {
      return this.metadata.state.message;
    } else {
      return false;
    }
  }

  get configuredCondition() {
    return findBy((this?.status?.conditions || []), 'type', 'configured') || {};
  }

  get valueOrDefaultValue() {
    return this.value || this.default;
  }

  get upgradeableVersion() {
    const value = this.value || '';

    if (!value) {
      return [];
    }

    return value.split(',').sort((a, b) => {
      return a > b ? -1 : 1;
    }).map( (V) => {
      return {
        label: V,
        value: V
      };
    });
  }

  get currentVersion() {
    return this.value || '';
  }

  get displayValue() { // Select the field you want to display
    if (this.id === 'backup-target') {
      return this.parseValue?.endpoint || ' ';
    }

    return null;
  }

  get parseValue() {
    let parseDefaultValue = {};

    try {
      parseDefaultValue = JSON.parse(this.value);
    } catch (err) {
      parseDefaultValue = JSON.parse(this.default);
    }

    return parseDefaultValue;
  }

  get isS3() {
    return this.parseValue.type === 's3';
  }

  get isNFS() {
    return this.parseValue.type === 'nfs';
  }

  get customValidationRules() {
    const id = this.id;

    const out = [];

    switch (id) {
    case 'backup-target':
      out.push( {
        nullable:       false,
        path:           'value',
        required:       true,
        type:           'string',
        validators:     ['backupTarget'],
      });
      break;
    }

    return out;
  }
}
