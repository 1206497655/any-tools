<template>
    <div class="wx-open-tag" :style="{ width: wrapWidth, height: wrapHeight }">
        <!-- 绝对定位 -->
        <div ref="frontBtn" class="front-btn">
            <!-- 默认插槽 实际展示的按钮 -->
            <slot></slot>
        </div>
        <!-- 绝对定位 -->
        <component
            ref="subscribeBtn"         
            class="shadow-btn"
            :is="tag"
            :template="template"
            :username="username"
            :path="path"
            :appid="appid"
            :extinfo="extinfo"
        >
            <script
                type="text/wxtag-template"
            >  
                <!-- 按钮的高度无法继承父元素高度，这里给定一个高度然后超出的使用overflow:hidden处理 -->
                <button style="width: 100%; height: 100px; opacity: 0;">
                订阅按钮
                </button>
            </script>
        </component>
    </div>
</template>

<script>
export default {
    name: 'WxOpenTag',
    props: {
        // 开放标签类型，默认订阅按钮，可选值有'wx-open-subscribe'，'wx-open-launch-weapp'，'wx-open-launch-app'
        tag: {
            type: String,
            default: 'wx-open-subscribe'
        },

        // 宽度
        width: {
            type: String || Number,
            required: true
        },

        // 高度
        height: {
            type: String || Number,
            required: true
        },

        // 模版id，多个模版id以逗号隔开
        template: {
            type: String,
            default: ''
        },

        // 所需跳转的小程序原始id，即小程序对应的以gh_开头的id，此属性仅在跳转小程序按钮下生效
        username: {
            type: String,
            default: ''
        },

        // 所需跳转的小程序内页面路径及参数，此属性仅在跳转小程序按钮下生效
        path: {
            type: String,
            default: ''
        },

        // 所需跳转的AppID，此属性仅在跳转App按钮下生效
        appid: {
            type: String,
            default: ''
        },

        // 跳转所需额外信息，此属性仅在跳转App按钮下生效
        extinfo: {
            default: ''
        }
    },
    computed: {
        wrapWidth() {
            if (typeof this.width === 'number') {
                return `${this.width}px`;
            } else {
                return this.width;
            }
        },
        wrapHeight() {
            if (typeof this.height === 'number') {
                return `${this.height}px`;
            } else {
                return this.height;
            }
        }
    },
    mounted() {
        // 在vue模板上直接订阅以下事件获得的结果为空，不得已才采用以下做法
        var btn = this.$refs.subscribeBtn;
        btn.addEventListener('success', e => {            
            this.handleSuccess(e.detail)
        });   
        btn.addEventListener('error', e => {             
            this.handleError(e.detail)
        });
        btn.addEventListener('ready', e => {            
            this.handleReady()
        });   
        btn.addEventListener('launch', e => {             
            this.handleLaunch(e.detail)
        });
    },
    methods: {
        handleSuccess(data) {
            // 订阅成功事件
            this.$emit('success', data);
        },
        handleError(data) {
            // 订阅/跳转小程序/跳转app失败事件
            this.$emit('error', data);
        },
        handleReady() {
            // 跳转小程序/跳转app标签初始化完毕，可以进行点击操作
            this.$emit('ready');
        },
        handleLaunch(data) {
            // 跳转小程序/跳转app用户点击跳转按钮并对确认弹窗进行操作后触发
            this.$emit('launch', data);
        }
    }
};
</script>

<style lang="scss" scoped>
.wx-open-tag {
    position: relative;
    overflow: hidden;
    width: 100%;
}
.front-btn {
    pointer-events: none; // 关键点 利用点击穿透间接点击背后的订阅按钮
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1; // 显示按钮在上
    width: 100%;
    height: 100%;
}
.shadow-btn {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 0; // 微信按钮在下
    width: 100%;
    height: 100%;
}
</style>
