declare type Nullable<T> = T | null;
interface Hsl {
    'h': number;
    's': number;
    'l': number;
    'a': number;
    [key: string]: number;
}
interface Hex {
    'hex': string;
    [key: string]: string;
}
interface Rgb {
    'r': number;
    'g': number;
    'b': number;
    'a': number;
    [key: string]: number;
}
interface Cmyk {
    'c': number;
    'm': number;
    'y': number;
    'k': number;
    [key: string]: number;
}
interface ColorRgbNodes {
    R: Nullable<HTMLInputElement>;
    G: Nullable<HTMLInputElement>;
    B: Nullable<HTMLInputElement>;
    A: Nullable<HTMLInputElement>;
}
interface ColorCmykNodes {
    C: Nullable<HTMLInputElement>;
    M: Nullable<HTMLInputElement>;
    Y: Nullable<HTMLInputElement>;
    K: Nullable<HTMLInputElement>;
}
interface RgbArrowNodes {
    RUp: Nullable<HTMLImageElement>;
    RDown: Nullable<HTMLImageElement>;
    GUp: Nullable<HTMLImageElement>;
    GDown: Nullable<HTMLImageElement>;
    BUp: Nullable<HTMLImageElement>;
    BDown: Nullable<HTMLImageElement>;
}
export interface SvgColorPickerOptions {
    el: string | HTMLElement;
    color: string;
    disableOpacity?: boolean;
    getColor: (res: {
        hex: string;
        rgb: Rgb;
        cmyk: Cmyk;
    }) => void;
}
export default class SvgColorPicker {
    options: SvgColorPickerOptions | null;
    container: Nullable<HTMLDivElement>;
    colorLeft: Nullable<HTMLDivElement>;
    colorOpacity: Nullable<HTMLDivElement>;
    colorMove: Nullable<HTMLDivElement>;
    movePoint: Nullable<HTMLDivElement>;
    huePoint: Nullable<HTMLDivElement>;
    opacityPoint: Nullable<HTMLDivElement>;
    colorHue: Nullable<HTMLDivElement>;
    colorShow: Nullable<HTMLDivElement>;
    canvas: Nullable<HTMLCanvasElement>;
    colorHex: Nullable<HTMLInputElement>;
    colorRgbNodes: ColorRgbNodes;
    colorCmykNodes: ColorCmykNodes;
    rgbArrowNodes: RgbArrowNodes;
    hsl: Hsl;
    hex: Hex;
    rgb: Rgb;
    cmyk: Cmyk;
    proxyColor: Hsl;
    proxyHex: Hex;
    proxyRgb: Rgb;
    proxyCmyk: Cmyk;
    isMoveDown: boolean;
    isOpacityDown: boolean;
    isHueDown: boolean;
    slideCache: Map<any, any>;
    slideBorderWidth: number;
    constructor(options: SvgColorPickerOptions);
    initData(): void;
    initNodes(): void;
    handleMousemove(e: MouseEvent): void;
    handleMouseup(): void;
    initEvents(): void;
    changeOpacity(clientX: number): void;
    changHue(clientX: number): void;
    changeColor(clientX: number, clientY: number): void;
    draw(): void;
    changePointPosition(hsl: Hsl): void;
    changeBg(tinyColor: any): void;
    changeHex(tinyColor: any): void;
    changeRgb(tinyColor: any): void;
    rgbToCmyk(rgb: Rgb): {
        c: number;
        y: number;
        m: number;
        k: number;
    };
    cmykToRgb(cmyk: Cmyk): {
        r: number;
        g: number;
        b: number;
    };
    changeCmyk(tinyColor: any): void;
    update(tinyColor: any): void;
    setColor(value: number | string, colorType: string): void;
    handleInput(target: HTMLInputElement, min: number, max: number): void;
    handleHexInput(target: HTMLInputElement): void;
    controlInput(): void;
    handleClick(target: HTMLImageElement, source: HTMLInputElement, min: number, max: number, type: 'up' | 'down'): void;
    arrowClick(): void;
    destroy(): void;
}
export {};
