const defaultOptions = {
    width: 320,
    height: 320,
    xAxis: [],
    yAxis: [],
    xGrad: 100,
    yGrad: 100,
    padding: 40,
    data: [],
    startValidator: (targetPoint, startPoint) => {
        return targetPoint[0] >= startPoint[0] && targetPoint[1] >= startPoint[1];
    },
    endValidator: (targetPoint, endPoint) => {
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
const getSpace = (length) => {
    if (length > XXL[0] && length <= XXL[1])
        return Space.get(XXL);
    if (length > XL[0] && length <= XL[1])
        return Space.get(XL);
    if (length > L[0] && length <= L[1])
        return Space.get(L);
    if (length > M[0] && length <= M[1])
        return Space.get(M);
    if (length > S[0] && length <= S[1])
        return Space.get(S);
    if (length > XS[0] && length <= XS[1])
        return Space.get(XS);
};
/**
 * 二维数组去重
 * @param source
 * @returns
 */
const filterArray = (source) => {
    const newArray = [];
    source.forEach(currentValue => {
        let isPush = true;
        newArray.forEach(currentValueIn => {
            if (currentValueIn) {
                if (currentValue[0] === currentValueIn[0] && currentValue[1] === currentValueIn[1]) {
                    isPush = false;
                }
            }
            else {
                newArray.push(currentValue);
            }
        });
        if (isPush) {
            newArray.push(currentValue);
        }
    });
    return newArray;
};
class SvgCartesianHeatmap {
    constructor(options) {
        this.options = defaultOptions;
        this.container = null;
        this.tooltip = null;
        this.tooltipText = null;
        this.coverage = null;
        this.canvas = null;
        this.ctx = null;
        this.rects = [];
        this.xGridSize = 0; // x轴方向grid大小
        this.yGridSize = 0; // y轴方向grid大小
        this.newXAxis = [];
        this.newYAxis = [];
        this.cursorPoint = [-1, -1]; // 光标位置
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
    initCanvas(options) {
        const { width, height } = options;
        const container = document.createElement('div');
        container.className = 'li-cartesian-heatmap';
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        const canvas = document.createElement('canvas');
        // 绘制canvas宽高
        canvas.width = width;
        canvas.height = height;
        canvas.onmousemove = this.handleMousemove.bind(this);
        canvas.onwheel = this.handleWheel.bind(this);
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
    initCoverage(options) {
        if (!this.container)
            return;
        const div = document.createElement('div');
        div.className = 'coverage';
        this.coverage = div;
        this.container.appendChild(this.coverage);
    }
    /**
     * 初始化tooltip工具
     * @param options 配置项
     */
    initTooltip(options) {
        if (!this.container)
            return;
        const div = document.createElement('div');
        div.innerHTML = `<div class="tooltip"><div class="container"><span class="info"></span><div class="arrow"></div></div></div>`;
        this.tooltip = div.children[0];
        this.tooltipText = this.tooltip.children[0].children[0];
        this.container.appendChild(this.tooltip);
    }
    /**
     * 展示tooltip以及坐标信息
     * @param point Point 坐标
     * @param offset Number 补正
     * @returns
     */
    showTooltip(point, offset) {
        if (!this.tooltip || !this.tooltipText)
            return;
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
        if (!this.tooltip)
            return;
        this.tooltip.style.display = 'none';
    }
    /**
     * 鼠标移动位置格式化为grid位置值
     * @param e Mousemove事件
     * @returns
     */
    handleMousemove(e) {
        const { options: { padding = 40 }, canvas, xGridSize, yGridSize, } = this;
        if (!canvas)
            return;
        const { offsetX, offsetY } = e;
        const point = [offsetX - padding, offsetY - padding];
        // 限制point的移动范围
        if (point[0] < 0 ||
            point[1] < 0 ||
            point[0] > canvas.width - padding * 2 ||
            point[1] > canvas.height - padding * 2) {
            this.cursorPoint = [-1, -1];
            // this.hideTooltip();
        }
        else {
            this.cursorPoint = [Math.ceil(point[0] / xGridSize), Math.ceil(point[1] / yGridSize)];
            const { offsetWidth } = this.tooltip;
            this.showTooltip(this.cursorPoint, padding - offsetWidth / 2);
        }
    }
    /**
     * 滑轮滚动放大缩小
     * @param e
     * @returns
     */
    handleWheel(e) {
        if (this.cursorPoint[0] <= 0 || this.cursorPoint[1] <= 0 || !this.canvas)
            return;
        const { canvas, xGridSize, yGridSize, options: { padding = 40, xGrad, yGrad }, } = this;
        const newOptions = Object.assign({}, this.options);
        // 向上滚动，放大
        if (e.deltaY && e.deltaY < 0) {
            console.log(xGridSize);
            const centerWidth = canvas.width - padding * 2;
            const centerHeight = canvas.height - padding * 2;
            if (xGridSize >= centerWidth || yGridSize >= centerHeight)
                return;
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
            if (xGridSize < 4 || yGridSize < 4)
                return;
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
    render(options) {
        var _a;
        if (!this.ctx || !this.canvas)
            return;
        const { padding = 40 } = this.options;
        const { xAxis, yAxis, xGrad, yGrad, data } = options;
        const xLength = Math.ceil((xAxis[1] - xAxis[0]) / xGrad) + 1;
        const yLength = Math.ceil((yAxis[1] - yAxis[0]) / yGrad) + 1;
        this.newXAxis = Array.from({ length: xLength }, (v, i) => {
            if (i < xLength - 1) {
                return Math.floor(xAxis[0] + i * xGrad);
            }
            else {
                return Math.floor(xAxis[1]);
            }
        });
        this.newYAxis = Array.from({ length: yLength }, (v, i) => {
            if (i < yLength - 1) {
                return Math.floor(yAxis[0] + i * yGrad);
            }
            else {
                return Math.floor(yAxis[1]);
            }
        });
        const axis = {
            xAxis: this.newXAxis,
            yAxis: this.newYAxis,
        };
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.translate(padding, padding);
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
        var _a;
        if (!this.ctx || !this.canvas)
            return;
        const { padding = 40 } = this.options;
        // 清除已有
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.translate(-padding, -padding);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
    }
    /**
     * 绘制轴线
     * @param axis 轴数据
     * @returns
     */
    paintAxis(axis) {
        const { ctx, canvas } = this;
        const { padding = 40 } = this.options;
        if (!canvas || !ctx)
            return;
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
            if (i % x_flag === 0 && xAxis[i]) {
                ctx.fillText(xAxis[i].toString(), xGridSize * i, -8);
                ctx.strokeStyle = '#d9d9d9'; // 设置每个线条的颜色
            }
            else {
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
            if (i % y_flag === 0 && yAxis[i]) {
                ctx.fillText(yAxis[i].toString(), -5, yGridSize * i + 5);
                ctx.strokeStyle = '#d9d9d9'; // 设置每个线条的颜色
            }
            else {
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
    getRectByPoint(axis, data, type = 'leftTop') {
        var _a, _b, _c, _d;
        const { xAxis = [], yAxis = [] } = axis;
        const rects = [];
        for (let k = 0; k < data.length; k++) {
            const point = data[k];
            for (let i = 0; i < xAxis.length - 1; i++) {
                for (let j = 0; j < yAxis.length - 1; j++) {
                    const start = [xAxis[i], yAxis[j]];
                    const end = [xAxis[i + 1], yAxis[j + 1]];
                    const startValid = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.startValidator) === null || _b === void 0 ? void 0 : _b.call(_a, point, start);
                    const endValid = (_d = (_c = this.options) === null || _c === void 0 ? void 0 : _c.endValidator) === null || _d === void 0 ? void 0 : _d.call(_c, point, end);
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
    calcCoverage(rects) {
        if (!this.coverage)
            return;
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
    paintRect(rects) {
        const { xGridSize, yGridSize, ctx } = this;
        if (!ctx)
            return;
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
    mount(el) {
        let parent = null;
        if (typeof el === 'string') {
            parent = document.querySelector(el);
        }
        else if (el instanceof HTMLElement) {
            parent = el;
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
    update(options) {
        this.options = Object.assign(this.options, options);
        this.clear();
        this.render(this.options);
    }
}

export { SvgCartesianHeatmap as default };
