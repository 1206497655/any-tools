# ScatterHeatmap 散点热力图

## 场景

用于计算点值在一定坐标区间内的落点情况以及落点密度。

### 安装

```shell
npm i @liyucan/color-picker
or
yarn add @liyucan/color-picker
```

### 使用

```ts
import SvgColorPicker from '@liyucan/color-picker';
const instance: SvgColorPicker = new SvgColorPicker({
    width: 320,
    height: 320,
    xAxis: [1000, 1800],
    yAxis: [1000, 1800],
    xGrad: 100,
    yGrad: 100,
    disableZoom: false,
    disableTooltip: false,
    data: [[1000, 1699], [1100, 1299 ], [1050, 1058 ], [1154, 1308 ], [1287, 1750 ], [1587, 1205 ], [1708, 1000 ], [1408, 1800 ], [1478, 1305 ], [1122, 1648]]
});
instance.mount('#app');
```

#### options

|  选项   | 说明  |  类型  |  默认值  |
|  ----  | ----  |  ----  | ----  |
| width  | 画布宽度，单位px | number | 320 |
| height  | 画布高度，单位px | number | 320 |
| xAxis  | x轴坐标值范围 | [number, number] |  |
| yAxis  | y轴坐标值范围 | [number, number] |  |
| xGrad  | x轴坐标值间隔 | number |  |
| yGrad  | y轴坐标值间隔 | number |  |
| disableZoom  | 关闭缩放功能 | boolean | false |
| disableTooltip  | 关闭坐标提示工具 | boolean | false |
| padding  | 内边距，单位px | number | 40 |
| data  | 值数据 | [number, number][] |  |

### 开发

```shell
npm install or yarn install
```

项目运行

```shell
npm run dev or yarn dev
```

项目构建

```shell
npm run build or yarn build
```
