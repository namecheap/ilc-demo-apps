<template>
    <div class="single-spa-container news-app">
        <transition name="fade" mode="out-in">
            <router-view class="view"></router-view>
        </transition>
    </div>
</template>

<script>
    export default {
        metaInfo: {
            title: 'Headline News',
            meta: [
                { name: 'description', content: 'This is the headlines apps description' },
                { name: 'keywords', content: 'news,headlines,vue,demo' },
            ]
        },
    }
</script>

<style scoped>
    .news-app {
        font-family: Lato, sans-serif;
        font-weight: 300;
    }
    nav.inner{
        display: inline-block;
    }
    nav.inner a{
        text-decoration: none;
        color: #F1EDEC;
        font-size: 1.6rem;
        line-height: 1.5;
        font-weight: 300;
        text-transform: capitalize;
        padding: 0 1rem;
    }
    nav.inner a:hover{
        text-decoration: underline;
    }
</style>
