# 二次封装的微信开放标签

## 支持框架

- vue 2.x

## 封装背景

1. 官方组件使用复杂，样式代码写在自定义组件中使得模板混乱并且不能被lint。
2. 官方组件不支持vue响应式更新。
3. 官方组件不支持在插槽中引用vue组件，图标等内容无法实现。
4. 官方组件不支持vue的模板事件。
5. 官方组件不支持通过代码button.click触发授权（受限于web-component技术，二次封装后也无法实现）。

## 支持程度

* [x] 服务号订阅通知按钮：wx-open-subscribe
* [x] 跳转小程序：wx-open-launch-weapp
* [x] 跳转APP：wx-open-launch-app
* [ ] 音频播放：wx-open-audio

## 实现原理

* 将表现按钮覆盖在开放按钮上，利用点击穿透效果间接点击订阅按钮

## 注意事项

* **使用此包前需要引入并初始化微信JS-SDK，参考[文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_Open_Tag.html#%E4%BD%BF%E7%94%A8%E6%AD%A5%E9%AA%A4)的步骤1~步骤5。**
* 开放标签属于自定义标签，Vue会给予未知标签的警告，可通过配置Vue.config.ignoredElements来忽略Vue对开放标签的检查。

## 使用方式

### 使用npm安装此包

```shell
npm install --save @liyucan/wx-open-tag
```

### 在Vue文件中引入并注册

```vue
<template>
    <wx-open-tag
        tag="wx-open-subscribe"
        width="106px"
        height="56px"
        template="TenvU22BA1jCp4YHfYEpRuESXYReQyDuhs4vbdWA99I"
        @success="handleSuccess"
        @error="handleError"
    >
        <button class="button">订阅公众号</button>
    </wx-open-tag>
</template>

<script>
import WxOpenTag from '@liyucan/wx-open-tag'
export default {
    name: 'subscribeBtn',
    components: { WxOpenTag },
    methods: {
        handleSuccess(data) {},
        handleError(error) {}
    }
}
</script>

<style lang="scss" scoped>
    .button {
        width: 100%;
        height: 100%;
    }
</style>
```

## API 说明

具体说明请移步阅读[官方文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_Open_Tag.html#%E6%9C%8D%E5%8A%A1%E5%8F%B7%E8%AE%A2%E9%98%85%E9%80%9A%E7%9F%A5%E6%8C%89%E9%92%AE%EF%BC%9Awx-open-subscribe)

### Props

#### 通用Props

|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|tag|开放标签类型，默认订阅按钮，可选值有'wx-open-subscribe'(服务号订阅通知按钮)，'wx-open-launch-weapp'(跳转小程序按钮)，'wx-open-launch-app'(跳转APP按钮)|`String`|`false`|wx-open-subscribe|
|width|宽度|—|`true`|-|
|height|高度|—|`true`|-|

#### tag值为wx-open-subscribe时有以下Props

|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|template|模版id，多个模版id以逗号隔开|`String`|`false`|-|

#### tag值为wx-open-launch-weapp时有以下Props

|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|username|所需跳转的小程序原始id，即小程序对应的以gh_开头的id|`String`|`false`|-|
|path|所需跳转的小程序内页面路径及参数|`String`|`false`|-|

#### tag值为wx-open-launch-app时有以下Props

|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|appid|所需跳转的AppID|`String`|`false`|-|
|extinfo|跳转所需额外信息|—|`false`|-|

### Events

#### tag值为wx-open-subscribe时有以下Events

|Event Name|Description|Parameters|
|---|---|---|
|success|订阅成功事件|{errMsg: 'subscribe:ok', subscribeDetails: string}|
|error|订阅失败事件|{errMsg: string, errCode: string}|

##### success返回值说明

|Name|Type|Description|
|---|---|---|
|errMsg|string|按钮操作成功时errMsg值为'subscribe:ok'|
|subscribeDetails|string|[TEMPLATE_ID]是动态的键，即模版id，值包括：'accept'、'reject'、'cancel'、'filter'，'accept'表示用户同意订阅该条id对应的模版消息，'reject'表示用户拒绝订阅该条id对应的模版消息，'cancel'表示用户取消订阅该条id对应的模版消息，'filter'表示该模版应该标题同名被后台过滤。例如：{ errMsg: "subscribe:ok", subscribeDetails: "{"TenvU22BA1jCp4YHfYEpRuESXYReQyDuhs4vbdWA99I":"{\"status\":\"accept\"}"}"表示用户同意订阅TenvU22BA1jCp4YHfYEpRuESXYReQyDuhs4vbdWA99I这条消息。|

##### error返回值说明

|Name|Type|Description|
|---|---|---|
|errMsg|string|订阅按钮调用失败错误信息|
|errCode|string|订阅按钮调用失败错误码，详细错误码需查阅官方文档|

#### tag值为wx-open-launch-weapp时有以下Events

|Event Name|Description|Parameters|
|---|---|---|
|ready|标签初始化完毕，可以进行点击操作|-|
|launch|用户点击跳转按钮并对确认弹窗进行操作后触发|{ userName: string, path: string }|
|error|用户点击跳转按钮后出现错误|{ errMsg: string, userName: string, path: string }|

##### error返回值说明

|Name|Type|Description|
|---|---|---|
|errMsg|string|"launch:fail"表示跳转失败|

#### tag值为wx-open-launch-app时有以下Events

|Event Name|Description|Parameters|
|---|---|---|
|ready|标签初始化完毕，可以进行点击操作|-|
|launch|用户点击跳转按钮并对确认弹窗进行操作后触发|{ appId: string, extInfo: string }|
|error|用户点击跳转按钮后出现错误|{ errMsg: string, appId: string, extInfo: string }|

##### error返回值说明

|Name|Type|Description|
|---|---|---|
|errMsg|string|"launch:fail"表示调⽤失败，或安卓上该应用未安装，或iOS上用户在弹窗上点击确认但该应⽤未安装；"launch:fail_check fail"表示校验App跳转权限失败，请确认是否正确绑定AppID|

### Slots

|Name|Description|Default Slot Content|
|---|---|---|
|default|默认插槽 实际展示的按钮|-|
