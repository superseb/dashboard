<script>
import { mapGetters } from 'vuex';
import { findBy } from '@/utils/array';
import { MANAGEMENT } from '@/config/types';
import { mapPref, DEV } from '@/store/prefs';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';

const UNKNOWN = 'unknown';
const UI_VERSION = process.env.VERSION || UNKNOWN;
const UI_COMMIT = process.env.COMMIT || UNKNOWN;
const MAX_CLUSTERS_TO_SHOW = 4;

export default {

  components: {},

  data() {
    const setting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'server-version');
    const fullVersion = setting?.value || 'unknown';
    let displayVersion = fullVersion;

    const match = fullVersion.match(/^(.*)-([0-9a-f]{40})-(.*)$/);

    if ( match ) {
      displayVersion = match[2].substr(0, 7);
    }

    return {
      shown:          false,
      displayVersion,
      fullVersion,
      uiCommit:       UI_COMMIT,
      uiVersion:      UI_VERSION,
      clusterFilter:  '',
    };
  },

  computed: {
    ...mapGetters(['clusterId']),
    ...mapGetters(['clusterReady', 'isMultiCluster', 'currentCluster',
      'currentProduct', 'backToRancherLink', 'backToRancherGlobalLink']),
    ...mapGetters('type-map', ['activeProducts']),
    ...mapGetters('i18n', ['selectedLocaleLabel', 'availableLocales']),

    value: {
      get() {
        return this.$store.getters['productId'];
      },
    },

    showClusterSearch() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);

      return all.length > MAX_CLUSTERS_TO_SHOW;
    },

    clusters() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
      let out = all.map((x) => {
        return {
          id:     x.id,
          label:  x.nameDisplay,
          ready:  x.isReady,
          osLogo: x.providerOsLogo,
          logo:   x.providerLogo,
        };
      });

      if (this.clusterFilter.length > 0) {
        out = out.filter(item => item.label.indexOf(this.clusterFilter) === 0);
      }

      const sorted = sortBy(out, ['ready:desc', 'label']);

      return sorted;
    },

    dev: mapPref(DEV),

    showLocale() {
      return Object.keys(this.availableLocales).length > 1 || this.dev;
    },

    showNone() {
      return this.dev;
    },

    multiClusterApps() {
      const options = this.options;

      return options.filter(opt => opt.inStore === 'management' && opt.category !== 'configuration');
    },

    configurationApps() {
      const options = this.options;

      return options.filter(opt => opt.category === 'configuration');
    },

    options() {
      const t = this.$store.getters['i18n/t'];
      // const isMultiCluster = this.$store.getters['isMultiCluster'];

      const entries = this.activeProducts.map((p) => {
        let label;
        const key = `product.${ p.name }`;

        if ( this.$store.getters['i18n/exists'](key) ) {
          label = t(key);
        } else {
          label = ucFirst(p.name);
        }

        const out = {
          label,
          icon:      `icon-${ p.icon || 'copy' }`,
          value:     p.name,
          removable: p.removable !== false,
          inStore:   p.inStore || 'cluster',
          weight:    p.weight || 1,
          category:  p.category || 'none',
        };

        if ( p.externalLink ) {
          out.kind = 'external';
          out.link = p.externalLink;
        } else if ( p.link ) {
          out.kind = 'internal';
          out.link = p.link;
        } else {
          out.kind = 'internal';
        }

        return out;
      });

      return entries;
    }
  },

  watch: {
    $route(to, from) {
      this.shown = false;
    }
  },

  mounted() {
    document.addEventListener('keyup', this.handler);
  },

  beforeDestroy() {
    document.removeEventListener('keyup', this.handler);
  },

  methods: {
    handler(e) {
      if (e.keyCode === 27) {
        this.hide();
      }
    },
    hide() {
      this.shown = false;
    },

    toggle() {
      this.shown = !this.shown;
    },

    switchLocale(locale) {
      this.$store.dispatch('i18n/switchTo', locale);
    },

    changeProduct(product, route = '', moreParams = {}) {
      const entry = findBy(this.options, 'value', product);

      if ( !entry ) {
        return;
      }

      if ( entry?.link ) {
        if ( entry.kind === 'external' ) {
          let windowName = '_blank';

          // Non-removable external links (MCM) go to a named window
          if ( entry.removable === false ) {
            windowName = `R_${ product }`;
          }

          window.open(entry.link, windowName);
          this.value = this.previous;

          return;
        } else {
          window.location.href = entry.link;
        }
      }

      this.previous = this.value;

      // Try product-specific index first
      const opt = {
        name:   route || `c-cluster-${ product }`,
        params: {
          cluster: this.clusterId,
          product,
          ...moreParams
        }
      };

      if ( !this.$router.getMatchedComponents(opt).length ) {
        opt.name = 'c-cluster-product';
      }

      this.$router.push(opt);

      this.shown = false;
    },
  }
};
</script>
<template>
  <div>
    <div class="menu" :class="{'raised': shown}" @click="toggle()">
      <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
    </div>
    <div v-if="shown" class="side-menu-glass" @click="hide()"></div>
    <transition name="fade">
      <div v-if="shown" class="side-menu" tabindex="-1">
        <div class="title">
          <div class="menu-spacer"></div>
          <img class="side-menu-logo" src="~/assets/images/pl/rancher-logo.svg" width="110" />
        </div>
        <div class="body">
          <div @click="hide()">
            <nuxt-link
              class="option cluster selector home"
              :to="{ name: 'home' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
              <div>
                {{ t('nav.home') }}
              </div>
            </nuxt-link>
          </div>
          <div class="category">
            {{ t('nav.categories.explore') }}
          </div>
          <div v-if="showClusterSearch" class="search">
            <input
              ref="clusterFilter"
              v-model="clusterFilter"
              :placeholder="t('nav.search.placeholder')"
            />
            <i v-if="clusterFilter.length > 0" class="icon icon-close" @click="clusterFilter=''" />
          </div>
          <div class="clusters" :class="{'fixed-height': showClusterSearch}">
            <div v-for="c in clusters" :key="c.id" @click="hide()">
              <nuxt-link
                v-if="c.ready"
                class="cluster selector"
                :to="{ name: 'c-cluster', params: { cluster: c.id } }"
              >
                <img :src="c.logo" />
                <div>{{ c.label }}</div>
              </nuxt-link>
            </div>
            <div v-if="clusters.length === 0" class="none-matching">
              {{ t('nav.search.noResults') }}
            </div>
          </div>
          <div class="category">
            {{ t('nav.categories.multiCluster') }}
          </div>
          <div v-for="a in multiClusterApps" :key="a.label" class="option" @click="changeProduct(a.value)">
            <i class="icon group-icon" :class="a.icon" />
            <div>{{ a.label }}</div>
          </div>
          <div class="category">
            {{ t('nav.categories.configuration') }}
          </div>
          <div v-for="a in configurationApps" :key="a.label" class="option" @click="changeProduct(a.value)">
            <i class="icon group-icon" :class="a.icon" />
            <div>{{ a.label }}</div>
          </div>
          <div class="pad"></div>
          <div class="cluster-manager">
            <a v-if="currentProduct && isMultiCluster" class="btn role-tertiary" :href="(currentProduct.inStore === 'management' ? backToRancherGlobalLink : backToRancherLink)">
              {{ t('nav.backToRancher') }}
            </a>
          </div>
        </div>
        <div class="footer">
          <div @click="hide()">
            <nuxt-link :to="{name: 'support' }">
              {{ t('nav.support') }}
            </nuxt-link>
          </div>
          <div v-tooltip="{ content: fullVersion, classes: 'footer-tooltip' }" class="version" v-html="displayVersion" />
          <div v-if="showLocale">
            <v-popover
              popover-class="localeSelector"
              placement="top"
              trigger="click"
            >
              <a class="locale-chooser">
                {{ selectedLocaleLabel }}
              </a>

              <template slot="popover">
                <ul class="list-unstyled dropdown" style="margin: -1px;">
                  <li v-if="showNone" v-t="'locale.none'" class="hand" @click="switchLocale('none')" />
                  <li
                    v-for="(label, name) in availableLocales"
                    :key="name"
                    class="hand"
                    @click="switchLocale(name)"
                  >
                    {{ label }}
                  </li>
                </ul>
              </template>
            </v-popover>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss">
  .localeSelector, .footer-tooltip {
    z-index: 1000;
  }

  .cluster.selector:hover {
    color: var(--primary-hover-text);
    background: var(--primary-hover-bg);
    border-radius: 5px;
    text-decoration: none;
  }

  .localeSelector {
    .popover-inner {
      padding: 10px 0;
    }

    .popover-arrow {
      display: none;
    }

    .popover:focus {
      outline: 0;
    }
  }
</style>

<style lang="scss" scoped>
  $clear-search-size: 20px;
  $icon-size: 24px;
  $option-padding: 5px;
  $option-height: $icon-size + $option-padding + $option-padding;

  .option {
    align-items: center;
    cursor: pointer;
    display: flex;
    padding: $option-padding 0 $option-padding 10px;

    > i {
      font-size: $icon-size;
      margin-right: 8px;
    }
    svg {
      margin-right: 8px;
      fill: var(--topmenu-text);
    }

    > div {
      color: var(--link-text);
    }

    &:hover {
      color: var(--primary-hover-text);
      background: var(--primary-hover-bg);
      border-radius: 5px;
      > div {
        color: var(--primary-hover-text);
      }
      svg {
        fill: var(--primary-hover-text);
      }
      div {
        color: var(--primary-hover-text);
      }
    }
  }

  .menu {
    position: absolute;
    left: 0;
    width: 55px;
    height: 54px;
    top: 0;
    grid-area: menu;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      background-color: var(--topmost-light-hover);
    }
    .menu-icon {
      width: 24px;
      height: 24px;
      fill: var(--header-btn-text);
    }
    &.raised {
      z-index: 200;
    }
  }

  .side-menu {
    position: absolute;
    top: 0;
    left: 0px;
    height: 100vh;
    width: 280px;
    background-color: var(--topmenu-bg);
    z-index: 100;
    border-right: 1px solid var(--topmost-border);
    box-shadow: 0 0 15px 4px var(--topmost-shadow);
    display: flex;
    flex-direction: column;
    padding: 0;

    &:focus {
      outline: 0;
    }

    .title {
      display: flex;
      height: 55px;
      flex: 0 0 55px;
      width: 100%;
      border-bottom: 1px solid var(--nav-border);
      justify-content: flex-start;
      align-items: center;
      .menu {
        display: flex;
        justify-content: center;
        width: 55px;
        margin-right: 10px;
      }
      .menu-icon {
        width: 24px;
        height: 24px;
      }
      .menu-spacer {
        width: 55px;
      }
    }
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin: 10px 20px;

      .category {
        padding: 10px 0;
        text-transform: uppercase;
        opacity: 0.8;
        margin-top: 10px;
      }

      .home:focus {
        outline: 0;
      }

      .cluster {
        padding: $option-padding 0 $option-padding 10px;
        align-items: center;
        display: flex;
        &:focus {
          outline: 0;
        }
        .cluser-name {
          font-size: 16px;
        }
        > img {
          max-height: $icon-size;
          max-width: $icon-size;
          margin-right: 8px;
        }
      }

      .pad {
        flex: 1;
      }

      .cluster-manager {
        .btn {
          border: 0;
          line-height: 32px;
          min-height: 32px;
          height: 32px;
          background-color: var(--header-btn-bg);
          color: var(--header-btn-text);

          &:hover {
            color: var(--primary-hover-text);
            background: var(--primary-hover-bg);
          }
        }
      }

      .search {
        position: relative;
        > input {
          background-color: transparent;
          margin-bottom: 8px;
          padding-right: 34px;
        }
        > i {
          position: absolute;
          font-size: $clear-search-size;
          top: ($option-height - $clear-search-size) / 2;
          right: 8px;
          opacity: 0.7;
          cursor: pointer;
          &:hover {
            color: var(--primary-hover-bg);
          }
        }
      }

      .clusters {
        overflow-y: scroll;
        overflow-x: hidden;

        &.fixed-height {
          height: $option-height * 4;
        }
      }

      .none-matching {
        padding: 8px
      }
    }
    .footer {
      margin: 20px;

      display: flex;
      flex: 0;
      flex-direction: row;
      > * {
        flex: 1;
        color: var(--link-text);

        &:first-child {
          text-align: left;
        }
        &:last-child {
          text-align: right;
        }
        text-align: center;
      }

      .version {
        cursor: help;
      }
    }
  }

  .side-menu-glass {
    background-color: transparent;
    position: absolute;
    top: 0;
    left: 0px;
    height: 100vh;
    width: 100vw;
    z-index: 99;
    opacity: 1;
  }

  .side-menu-logo {
    margin-left: 10px;
    opacity: 1;
    transition: opacity 1.2s;
    transition-delay: 0s;
  }

  .fade-enter-active {
    .side-menu-logo {
      opacity: 0;
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: all 0.2s;
    transition-timing-function: ease;
  }

  .fade-leave-active {
    transition: all 0.4s;
  }

  .fade-leave-to {
    left: -300px;
  }

  .fade-enter {
    left: -300px;

    .side-menu-logo {
      opacity: 0;
    }
  }

  .locale-chooser {
    cursor: pointer;
  }

  .localeSelector {
    ::v-deep .popover-inner {
      padding: 50px 0;
    }

    ::v-deep .popover-arrow {
      display: none;
    }

    ::v-deep .popover:focus {
      outline: 0;
    }

    li {
      padding: 8px 20px;

      &:hover {
        background-color: var(--dropdown-hover-bg);
        color: var(--dropdown-hover-text);
        text-decoration: none;
      }
    }
  }
</style>
