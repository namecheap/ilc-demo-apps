<template>
  <div class="single-spa-container">
    <transition name="fade" mode="out-in">
      <router-view class="view"></router-view>
    </transition>
  </div>
</template>

<script>
  export default {
      props: ['mountParcel'],
      provide() {
          return {
              mountParcel: this.mountParcel
          }
      }
  }
</script>
