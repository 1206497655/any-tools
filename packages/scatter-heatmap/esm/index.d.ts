declare type Point = [number, number];
declare type Rect = [number, number];
interface Axis {
    xAxis: number[];
    yAxis: number[];
}
interface SvgCartesianHeatmapOptions {
    width: number;
    height: number;
    xAxis: number[];
    yAxis: number[];
    xGrad: number;
    yGrad: number;
    data: Point[];
    disableZoom?: boolean;
    disableTooltip?: boolean;
    padding?: number;
    startValidator?: (targetPoint: Point, startPoint: Point) => boolean;
    endValidator?: (targetPoint: Point, endPoint: Point) => boolean;
}
export default class SvgCartesianHeatmap {
    options: SvgCartesianHeatmapOptions;
    container: HTMLDivElement | null;
    tooltip: HTMLDivElement | null;
    tooltipText: HTMLSpanElement | null;
    coverage: HTMLDivElement | null;
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    rects: Rect[];
    xGridSize: number;
    yGridSize: number;
    newXAxis: number[];
    newYAxis: number[];
    cursorPoint: Point;
    constructor(options: SvgCartesianHeatmapOptions);
    /**
     * 初始化画布
     * @param options 配置项
     * @returns
     */
    initCanvas(options: SvgCartesianHeatmapOptions): void;
    /**
     * 覆盖度
     * @param options 配置项
     * @returns
     */
    initCoverage(options: SvgCartesianHeatmapOptions): void;
    /**
     * 初始化tooltip工具
     * @param options 配置项
     */
    initTooltip(options: SvgCartesianHeatmapOptions): void;
    /**
     * 展示tooltip以及坐标信息
     * @param point Point 坐标
     * @param offset Number 补正
     * @returns
     */
    showTooltip(point: Point, offset: number): void;
    /**
     * 隐藏tooltip
     * @param
     * @returns
     */
    hideTooltip(): void;
    /**
     * 鼠标移动位置格式化为grid位置值
     * @param e Mousemove事件
     * @returns
     */
    handleMousemove(e: MouseEvent): void;
    /**
     * 滑轮滚动放大缩小
     * @param e
     * @returns
     */
    handleWheel(e: WheelEvent): void;
    /**
     * 渲染内容
     * @param options 配置项
     * @returns
     */
    render(options: SvgCartesianHeatmapOptions): void;
    /**
     * 清除画布
     * @returns
     */
    clear(): void;
    /**
     * 绘制轴线
     * @param axis 轴数据
     * @returns
     */
    paintAxis(axis: Axis): void;
    /**
     * 点数据落位计算
     * @param axis 轴数据
     * @param data data数据
     * @param type
     * @returns rects
     */
    getRectByPoint(axis: Axis, data: Point[], type?: 'leftTop' | 'rightBottom'): Rect[];
    /**
     * 计算覆盖度
     * @param rects
     * @returns
     */
    calcCoverage(rects: Rect[]): void;
    /**
     * 绘制矩形
     * @param rects 矩形数据
     * @returns
     */
    paintRect(rects: Rect[]): void;
    /**
     * 挂载示例
     * @param el 挂载节点
     */
    mount(el: HTMLElement | string): void;
    /**
     * 更新配置项
     * @param options 配置项
     */
    update(options: {
        [P in keyof SvgCartesianHeatmapOptions]?: SvgCartesianHeatmapOptions[P];
    }): void;
}
export {};
