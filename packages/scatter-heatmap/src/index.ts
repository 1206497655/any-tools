type Point = [number, number];

// 只需要起始点结合gridSize就可以绘制矩形
type Rect = [number, number];

interface Axis {
  xAxis: number[];
  yAxis: number[];
}

interface SvgCartesianHeatmapOptions {
  width: number; // 单位px
  height: number; // 单位px
  xAxis: number[]; // 从小到大排序
  yAxis: number[]; // 从小到大排序
  xGrad: number;
  yGrad: number;
  data: Point[];
  disableZoom?: boolean;
  disableTooltip?: boolean;
  padding?: number; // 内边距
  startValidator?: (targetPoint: Point, startPoint: Point) => boolean; // 开始坐标与目标坐标的位置判断
  endValidator?: (targetPoint: Point, endPoint: Point) => boolean; // 结束坐标与目标坐标的位置判断
}

const defaultOptions: SvgCartesianHeatmapOptions = {
  width: 320, // 单位px
  height: 320, // 单位px
  xAxis: [],
  yAxis: [],
  xGrad: 100,
  yGrad: 100,
  padding: 40,
  data: [], // 坐标点数据
  disableZoom: false,
  disableTooltip: false,
  startValidator: (targetPoint: Point, startPoint: Point) => {
    return targetPoint[0] >= startPoint[0] && targetPoint[1] >= startPoint[1];
  },
  endValidator: (targetPoint: Point, endPoint: Point) => {
    return targetPoint[0] < endPoint[0] && targetPoint[1] < endPoint[1];
  },
};

// 滑轮缩放倍数
const zoomScale = 2;

// 间隔区间
const Space = new Map();

const XXL = [0, 8];
const XL = [8, 16];
const L = [16, 22];
const M = [22, 50];
const S = [50, 200];
const XS = [200, 1000];
Space.set(XXL, 1);
Space.set(XL, 2);
Space.set(L, 3);
Space.set(M, 5);
Space.set(S, 10);
Space.set(XS, 14);

/**
 * 获取显示区间间隔值
 * @param length
 * @returns
 */
const getSpace = (length: number) => {
  if (length > XXL[0] && length <= XXL[1]) return Space.get(XXL);
  if (length > XL[0] && length <= XL[1]) return Space.get(XL);
  if (length > L[0] && length <= L[1]) return Space.get(L);
  if (length > M[0] && length <= M[1]) return Space.get(M);
  if (length > S[0] && length <= S[1]) return Space.get(S);
  if (length > XS[0] && length <= XS[1]) return Space.get(XS);
};

/**
 * 二维数组去重
 * @param source
 * @returns
 */
const filterArray = (source: [number, number][]) => {
  const newArray: [number, number][] = [];
  source.forEach(currentValue => {
    let isPush = true;
    newArray.forEach(currentValueIn => {
      if (currentValueIn) {
        if (currentValue[0] === currentValueIn[0] && currentValue[1] === currentValueIn[1]) {
          isPush = false;
        }
      } else {
        newArray.push(currentValue);
      }
    });
    if (isPush) {
      newArray.push(currentValue);
    }
  });
  return newArray;
};

export default class SvgCartesianHeatmap {
  options: SvgCartesianHeatmapOptions = defaultOptions;

  container: HTMLDivElement | null = null;
  tooltip: HTMLDivElement | null = null;
  tooltipText: HTMLSpanElement | null = null;
  coverage: HTMLDivElement | null = null;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  rects: Rect[] = [];
  xGridSize = 0; // x轴方向grid大小
  yGridSize = 0; // y轴方向grid大小
  newXAxis: number[] = [];
  newYAxis: number[] = [];
  cursorPoint: Point = [-1, -1]; // 光标位置

  constructor(options: SvgCartesianHeatmapOptions) {
    this.options = Object.assign(defaultOptions, options);
    this.initCanvas(this.options);
    this.initCoverage(this.options);
    this.initTooltip(this.options);
    this.render(this.options);
  }
  /**
   * 初始化画布
   * @param options 配置项
   * @returns
   */
  initCanvas(options: SvgCartesianHeatmapOptions) {
    const { width, height } = options;
    const container = document.createElement('div');
    container.className = 'li-scatter-heatmap';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;

    const canvas = document.createElement('canvas');

    // 绘制canvas宽高
    canvas.width = width;
    canvas.height = height;

    canvas.onmousemove = this.handleMousemove.bind(this);

    if(!this.options.disableZoom) {
      canvas.onwheel = this.handleWheel.bind(this);
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    container.appendChild(canvas);
    this.container = container;
  }
  /**
   * 覆盖度
   * @param options 配置项
   * @returns
   */
  initCoverage(options: SvgCartesianHeatmapOptions) {
    if (!this.container) return;
    const div = document.createElement('div');
    div.className = 'coverage';
    this.coverage = div as HTMLDivElement;
    this.container.appendChild(this.coverage);
  }
  /**
   * 初始化tooltip工具
   * @param options 配置项
   */
  initTooltip(options: SvgCartesianHeatmapOptions) {
    if (!this.container) return;
    const div = document.createElement('div');
    div.innerHTML = `<div class="tooltip"><div class="container"><span class="info"></span><div class="arrow"></div></div></div>`;
    this.tooltip = div.children[0] as HTMLDivElement;
    this.tooltipText = this.tooltip.children[0].children[0] as HTMLSpanElement;

    this.container.appendChild(this.tooltip);
  }
  /**
   * 展示tooltip以及坐标信息
   * @param point Point 坐标
   * @param offset Number 补正
   * @returns
   */
  showTooltip(point: Point, offset: number) {
    if (!this.tooltip || !this.tooltipText) return;
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${point[0] * this.xGridSize + offset}px`;
        this.tooltip.style.top = `${point[1] * this.yGridSize + offset}px`;
        this.tooltipText.innerHTML = `${this.newXAxis[point[0]]}*${this.newYAxis[point[1]]}`;
  }
  /**
   * 隐藏tooltip
   * @param
   * @returns
   */
  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.style.display = 'none';
  }
  /**
   * 鼠标移动位置格式化为grid位置值
   * @param e Mousemove事件
   * @returns
   */
  handleMousemove(e: MouseEvent) {
    const {
      options: { padding = 40 },
      canvas,
      xGridSize,
      yGridSize,
    } = this;
    if (!canvas) return;
    const { offsetX, offsetY } = e;
    const point = [offsetX - padding, offsetY - padding];
    // 限制point的移动范围
    if (
      point[0] < 0 ||
      point[1] < 0 ||
      point[0] > canvas.width - padding * 2 ||
      point[1] > canvas.height - padding * 2
    ) {
      this.cursorPoint = [-1, -1];
      // this.hideTooltip();
    } else {
      this.cursorPoint = [Math.ceil(point[0] / xGridSize), Math.ceil(point[1] / yGridSize)];
      const { offsetWidth } = this.tooltip as HTMLDivElement;
      !this.options.disableTooltip && this.showTooltip(this.cursorPoint, padding - offsetWidth / 2);
    }
  }
  /**
   * 滑轮滚动放大缩小
   * @param e
   * @returns
   */
  handleWheel(e: WheelEvent) {
    if (this.cursorPoint[0] <= 0 || this.cursorPoint[1] <= 0 || !this.canvas) return;
    const {
      canvas,
      xGridSize,
      yGridSize,
      options: { padding = 40, xGrad, yGrad },
    } = this;
    const newOptions = {
      ...this.options,
    };

    // 向上滚动，放大
    if (e.deltaY && e.deltaY < 0) {
      console.log(xGridSize);
      const centerWidth = canvas.width - padding * 2;
      const centerHeight = canvas.height - padding * 2;
      if (xGridSize >= centerWidth || yGridSize >= centerHeight) return;
      this.clear();
      const newXGrad = xGrad * zoomScale;
      newOptions.xGrad = newXGrad;
      const newYGrad = yGrad * zoomScale;
      newOptions.yGrad = newYGrad;

      this.render(newOptions);

      this.options.xGrad = newXGrad;
      this.options.yGrad = newYGrad;
    }
    // 向下滚动，缩小
    if (e.deltaY && e.deltaY > 0) {
      // 控制格子的最小宽度或高度为8
      if (xGridSize < 4 || yGridSize < 4) return;
      this.clear();
      const newXGrad = xGrad / zoomScale;
      newOptions.xGrad = newXGrad;
      const newYGrad = yGrad / zoomScale;
      newOptions.yGrad = newYGrad;

      this.render(newOptions);

      this.options.xGrad = newXGrad;
      this.options.yGrad = newYGrad;
    }
  }
  /**
   * 渲染内容
   * @param options 配置项
   * @returns
   */
  render(options: SvgCartesianHeatmapOptions) {
    if (!this.ctx || !this.canvas) return;
    const { padding = 40 } = this.options;
    const { xAxis, yAxis, xGrad, yGrad, data } = options;
    const xLength = Math.ceil((xAxis[1] - xAxis[0]) / xGrad) + 1;
    const yLength = Math.ceil((yAxis[1] - yAxis[0]) / yGrad) + 1;
    this.newXAxis = Array.from({ length: xLength }, (v, i) => {
      if (i < xLength - 1) {
        return Math.floor(xAxis[0] + i * xGrad);
      } else {
        return Math.floor(xAxis[1]);
      }
    });

    this.newYAxis = Array.from({ length: yLength }, (v, i) => {
      if (i < yLength - 1) {
        return Math.floor(yAxis[0] + i * yGrad);
      } else {
        return Math.floor(yAxis[1]);
      }
    });
    const axis = {
      xAxis: this.newXAxis,
      yAxis: this.newYAxis,
    };
    this.ctx?.translate(padding as number, padding as number);
    this.paintAxis(axis);
    const rect = this.getRectByPoint(axis, data);
    this.paintRect(rect);
    this.calcCoverage(rect);
  }
  /**
   * 清除画布
   * @returns
   */
  clear() {
    if (!this.ctx || !this.canvas) return;
    const { padding = 40 } = this.options;
    // 清除已有
    this.ctx?.translate(-padding as number, -padding as number);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
  }
  /**
   * 绘制轴线
   * @param axis 轴数据
   * @returns
   */
  paintAxis(axis: Axis) {
    const { ctx, canvas } = this;
    const { padding = 40 } = this.options;
    if (!canvas || !ctx) return;
    const { xAxis = [], yAxis = [] } = axis;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    // 绘制画布尺寸
    const panelWidth = canvasWidth - padding * 2;
    const panelHeight = canvasHeight - padding * 2;
    const xGridSize = panelWidth / (xAxis.length - 1);
    const yGridSize = panelHeight / (yAxis.length - 1);
    this.xGridSize = xGridSize;
    this.yGridSize = yGridSize;
    ctx.font = '12px PingFangSC-Regular';
    ctx.fillStyle = '#00000073';

    // 绘制axis
    ctx.textAlign = 'center';

    const x_flag = getSpace(xAxis.length);
    for (let i = 0; i < xAxis.length; i++) {
      ctx.beginPath(); // 开启路径，设置不同的样式
      if( i % x_flag === 0 && xAxis[i] ) {
        ctx.fillText(xAxis[i].toString(), xGridSize * i, -8);
        ctx.strokeStyle = '#d9d9d9'; // 设置每个线条的颜色
      } else {
        ctx.strokeStyle = '#eeeeee'; // 设置每个线条的颜色
      }

      ctx.moveTo(xGridSize * i - 0.5, 0); // -0.5是为了解决像素模糊问题
      ctx.lineTo(xGridSize * i - 0.5, panelWidth);
      ctx.stroke();
    }

    // 绘制axis value
    ctx.textAlign = 'right';
    const y_flag = getSpace(yAxis.length);
    for (let i = 0; i < yAxis.length; i++) {
      ctx.beginPath(); // 开启路径，设置不同的样式
      if(i % y_flag === 0 && yAxis[i]) {
        ctx.fillText(yAxis[i].toString(), -5, yGridSize * i + 5);
        ctx.strokeStyle = '#d9d9d9'; // 设置每个线条的颜色
      } else {
        ctx.strokeStyle = '#eeeeee'; // 设置每个线条的颜色
      }
      ctx.moveTo(0, yGridSize * i - 0.5); // -0.5是为了解决像素模糊问题
      ctx.lineTo(panelHeight + 0, yGridSize * i - 0.5);
      ctx.stroke();
    }
  }
  /**
   * 点数据落位计算
   * @param axis 轴数据
   * @param data data数据
   * @param type
   * @returns rects
   */
  getRectByPoint(axis: Axis, data: Point[], type: 'leftTop' | 'rightBottom' = 'leftTop') {
    const { xAxis = [], yAxis = [] } = axis;
    const rects: Rect[] = [];
    for (let k = 0; k < data.length; k++) {
      const point = data[k];
      for (let i = 0; i < xAxis.length - 1; i++) {
        for (let j = 0; j < yAxis.length - 1; j++) {
          const start: Point = [xAxis[i], yAxis[j]];
          const end: Point = [xAxis[i + 1], yAxis[j + 1]];
          const startValid = this.options?.startValidator?.(point, start);
          const endValid = this.options?.endValidator?.(point, end);
          if (startValid && endValid) {
            // 保存时转为grid所在的位置值，方便后续计算
            type === 'leftTop' ? rects.push([i, j]) : rects.push([i + 1, j + 1]);
          }
        }
      }
    }
    return rects;
  }
  /**
   * 计算覆盖度
   * @param rects
   * @returns
   */
  calcCoverage(rects: Rect[]) {
    if (!this.coverage) return;
    const target = filterArray(rects).length;
    const source = (this.newXAxis.length - 1) * (this.newYAxis.length - 1);
    let res = Number(((target / source) * 100).toFixed(2));
    if (res % 1 === 0) {
      res = Math.floor(res);
    }
    this.coverage.innerHTML = `${res}%`;
  }
  /**
   * 绘制矩形
   * @param rects 矩形数据
   * @returns
   */
  paintRect(rects: Rect[]) {
    const { xGridSize, yGridSize, ctx } = this;
    if (!ctx) return;
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      const x = rect[0];
      const y = rect[1];
      ctx.beginPath();
      ctx.moveTo(x * xGridSize, y * xGridSize);
      ctx.fillStyle = '#E6F6FF';
      ctx.fillRect(x * xGridSize, y * yGridSize, xGridSize - 1, yGridSize - 1); // - 1是为了展示边框
      ctx.stroke();
    }
  }

  /**
   * 挂载示例
   * @param el 挂载节点
   */
  mount(el: HTMLElement | string) {
    let parent = null;
    if (typeof el === 'string') {
      parent = document.querySelector(el as string) as HTMLElement;
    } else if (el instanceof HTMLElement) {
      parent = el as HTMLElement;
    }
    if (!parent) {
      throw new Error('options.el is valid.');
    }
    this.container && parent.appendChild(this.container);
  }

  /**
   * 更新配置项
   * @param options 配置项
   */
  update(options:  {[P in keyof SvgCartesianHeatmapOptions]?: SvgCartesianHeatmapOptions[P] }) {
    this.options = Object.assign(this.options, options);
    this.clear();
    this.render(this.options);
  }
}
