import tinyColor from 'tinycolor2';
import HtmlString from './index.html';

type Nullable<T> = T | null

interface Hsl {
    'h': number
    's': number
    'l': number
    'a': number
    [key: string]: number
}

interface Hex {
    'hex': string
    [key: string]: string
}

interface Rgb {
    'r': number
    'g': number
    'b': number
    'a': number
    [key: string]: number
}

interface Cmyk {
    'c': number
    'm': number
    'y': number
    'k': number
    [key: string]: number
}

interface ColorRgbNodes {
    R: Nullable<HTMLInputElement>
    G: Nullable<HTMLInputElement>
    B: Nullable<HTMLInputElement>
    A: Nullable<HTMLInputElement>
}

interface ColorCmykNodes {
    C: Nullable<HTMLInputElement>
    M: Nullable<HTMLInputElement>
    Y: Nullable<HTMLInputElement>
    K: Nullable<HTMLInputElement>
}

interface RgbArrowNodes {
    RUp: Nullable<HTMLImageElement>
    RDown: Nullable<HTMLImageElement>
    GUp: Nullable<HTMLImageElement>
    GDown: Nullable<HTMLImageElement>
    BUp: Nullable<HTMLImageElement>
    BDown: Nullable<HTMLImageElement>
}

export interface SvgColorPickerOptions {
    el: string | HTMLElement;
    color: string;
    disableOpacity?: boolean;
    getColor: (res: {hex: string; rgb: Rgb; cmyk: Cmyk}) => void;
}

const defaultOptions: SvgColorPickerOptions = {
    el: '',
    color: '',
    disableOpacity: true,
    getColor: () => ({})
}

export default class SvgColorPicker {
    options:SvgColorPickerOptions | null = null;

    //获取元素
    container: Nullable<HTMLDivElement> = null;
    colorLeft: Nullable<HTMLDivElement> = null;
    colorOpacity: Nullable<HTMLDivElement> = null;
    colorMove: Nullable<HTMLDivElement> = null;
    movePoint: Nullable<HTMLDivElement> = null;
    huePoint: Nullable<HTMLDivElement> = null;
    opacityPoint: Nullable<HTMLDivElement> = null;
    colorHue: Nullable<HTMLDivElement> = null;
    colorShow: Nullable<HTMLDivElement> = null;
    canvas: Nullable<HTMLCanvasElement> = null;

    colorHex: Nullable<HTMLInputElement> = null;
    
    colorRgbNodes: ColorRgbNodes = {
        R: null,
        G: null,
        B: null,
        A: null,
    }

    colorCmykNodes: ColorCmykNodes = {
        C: null,
        M: null,
        Y: null,
        K: null,
    }

    rgbArrowNodes: RgbArrowNodes = {
        RUp: null,
        RDown: null,
        GUp: null,
        GDown: null,
        BUp: null,
        BDown: null
    }

    hsl: Hsl = {
        'h': 0,
        's': 0,
        'l': 0,
        'a': 1
    };
    hex: Hex = {
        hex: '#000000'
    };
    rgb: Rgb = {
        'r': 0,
        'g': 0,
        'b': 0,
        'a': 1
    };
    cmyk: Cmyk = {
        'c': 0,
        'm': 0,
        'y': 0,
        'k': 0
    };
    proxyColor = this.hsl
    proxyHex = this.hex
    proxyRgb = this.rgb
    proxyCmyk = this.cmyk
    
    isMoveDown = false;
    isOpacityDown = false;
    isHueDown = false;

    // slide的缓存，减少计算量
    slideCache = new Map();
    // slide的白色边框宽度
    slideBorderWidth = 2;

    constructor(options: SvgColorPickerOptions) {
        this.options = Object.assign(defaultOptions, options);
        this.initData();
        this.initNodes();
        this.initEvents();
        this.draw();
        this.controlInput();
        this.arrowClick();
        // 初始化展示
        this.update(tinyColor(this.hsl));
        this.changePointPosition(this.hsl);
    }

    initData() {
        // 初始化色值
        if(this.options?.color) {
            const tinyInstance = tinyColor(this.options?.color);
            this.hex = {
                hex: this.options.color
            }
            this.hsl = tinyInstance['toHsl']();
            this.rgb = tinyInstance['toRgb']();
            this.cmyk = this.rgbToCmyk(this.rgb);
        }

        // 代理模型
        let tasks: any[] = [];
        this.proxyColor = new Proxy(this.hsl, {
            get: (color, prop: string) => {
                return this.hsl[prop];
            },
            set: (color, prop: string, value: number) => {
                this.hsl[prop] = value;

                // 在一次事件循环中，更新任务只执行一次
                tasks.push(() => {
                    this.update(tinyColor(this.hsl));
                    // 导出结果
                    this.options?.getColor({hex: this.hex.hex, rgb: this.rgb, cmyk: this.cmyk});
                    this.draw();
                });
                const length = tasks.length;
                setTimeout(() => {
                    if(length === tasks.length) {
                        tasks.pop()();
                        tasks = [];
                    }
                })
                return true
            }
        });
        // 代理hex
        this.proxyHex = new Proxy(this.hex, {
            get: (color, prop: string) => {
                return this.hex[prop];
            },
            set: (color, prop: string, value: string) => {
                this.hex[prop] = value;
                const tinyInstance = tinyColor(this.hex.hex);
                const hsl = tinyInstance['toHsl']();
                this.hsl = hsl;
                this.changeBg(tinyInstance);
                this.changeCmyk(tinyInstance);
                this.changeRgb(tinyInstance);
                this.changePointPosition(this.hsl);
                // 导出结果
                this.options?.getColor({hex: this.hex.hex, rgb: this.rgb, cmyk: this.cmyk});
                return true
            }
        })
        // 代理rgb
        this.proxyRgb = new Proxy(this.rgb, {
            get: (color, prop: string) => {
                return this.rgb[prop];
            },
            set: (color, prop: string, value: number) => {
                this.rgb[prop] = value;
                const tinyInstance = tinyColor(this.rgb);
                const hsl = tinyInstance['toHsl']();
                this.hsl = hsl;
                this.changeBg(tinyInstance);
                this.changeHex(tinyInstance);
                this.changeCmyk(tinyInstance);
                this.changePointPosition(this.hsl);
                // 导出结果
                this.options?.getColor({hex: this.hex.hex, rgb: this.rgb, cmyk: this.cmyk});
                return true
            }
        })
        // 代理cmyk
        this.proxyCmyk = new Proxy(this.cmyk, {
            get: (color, prop: string) => {
                return this.cmyk[prop];
            },
            set: (color, prop: string, value: number) => {
                this.cmyk[prop] = value / 100;
                const rgb = this.cmykToRgb(this.cmyk);
                const tinyInstance = tinyColor(rgb);
                const hsl = tinyInstance['toHsl']();
                this.hsl = hsl;
                this.changeBg(tinyInstance);
                this.changeHex(tinyInstance);
                this.changeRgb(tinyInstance);
                this.changePointPosition(this.hsl);
                // 导出结果
                this.options?.getColor({hex: this.hex.hex, rgb: this.rgb, cmyk: this.cmyk});
                return true;
            }
        })
    }

    // 初始化节点
    initNodes() {
            let parent = null;
            if(typeof this.options?.el === 'string') {
                parent = document.querySelector(this.options?.el as string) as HTMLElement;
            } else if (this.options?.el instanceof HTMLElement) {
                parent = this.options?.el as HTMLElement;
            }
            if(!parent) {
                throw new Error('options.el is valid.');
            }
            parent && (parent.innerHTML = HtmlString);
            const container = parent.querySelector('.li-color-picker') as HTMLDivElement;
            this.colorLeft = container.querySelector<HTMLDivElement>(".color-handler .left");
            this.colorHue = container.querySelector<HTMLDivElement>(".color-hue");
            this.colorOpacity = container.querySelector<HTMLDivElement>(".color-opacity");
            this.colorMove = container.querySelector<HTMLDivElement>('.color-move');
            this.movePoint = (this.colorMove as HTMLDivElement).querySelector<HTMLDivElement>('.move');
            this.huePoint = (this.colorHue as HTMLDivElement).querySelector<HTMLDivElement>('.outside-slide');
            this.opacityPoint = (this.colorOpacity as HTMLDivElement).querySelector<HTMLDivElement>('.outside-slide');
            this.colorShow = container.querySelector<HTMLDivElement>(".color-show");
            this.canvas = container.querySelector<HTMLCanvasElement>('canvas');

            this.colorHex = container.querySelector<HTMLInputElement>('.color-hex-input');

            this.colorRgbNodes.R = container.querySelector<HTMLInputElement>('.color-rgb-r-input');
            this.colorRgbNodes.G = container.querySelector<HTMLInputElement>('.color-rgb-g-input');
            this.colorRgbNodes.B = container.querySelector<HTMLInputElement>('.color-rgb-b-input');

            this.colorCmykNodes.C = container.querySelector<HTMLInputElement>('.color-cmyk-c-input');
            this.colorCmykNodes.M = container.querySelector<HTMLInputElement>('.color-cmyk-m-input');
            this.colorCmykNodes.Y = container.querySelector<HTMLInputElement>('.color-cmyk-y-input');
            this.colorCmykNodes.K = container.querySelector<HTMLInputElement>('.color-cmyk-k-input');
            
            const rArrowWrap = container.querySelector<HTMLDivElement>('.r-arrow-wrap');
            this.rgbArrowNodes.RUp = rArrowWrap?.children[0] as HTMLImageElement;
            this.rgbArrowNodes.RDown = rArrowWrap?.children[1] as HTMLImageElement;

            const gArrowWrap = container.querySelector<HTMLDivElement>('.g-arrow-wrap');
            this.rgbArrowNodes.GUp = gArrowWrap?.children[0] as HTMLImageElement;
            this.rgbArrowNodes.GDown = gArrowWrap?.children[1] as HTMLImageElement;

            const bArrowWrap = container.querySelector<HTMLDivElement>('.b-arrow-wrap');
            this.rgbArrowNodes.BUp = bArrowWrap?.children[0] as HTMLImageElement;
            this.rgbArrowNodes.BDown = bArrowWrap?.children[1] as HTMLImageElement;

            // 透明度节点处理
            if(this.options?.disableOpacity) {
                (this.colorLeft as HTMLDivElement).style.justifyContent = 'space-around';
                (this.colorOpacity as HTMLDivElement).style.display = 'none';
            }else {
                (container as HTMLDivElement).className = 'color-picker color-picker-large';
                (this.colorHex as HTMLDivElement).style.minWidth = '60px';
            }

            // canvas宽高设置
            const { offsetWidth, offsetHeight } = this.colorMove as HTMLDivElement;
            (this.canvas as HTMLCanvasElement).width = offsetWidth;
            (this.canvas as HTMLCanvasElement).height = offsetHeight;

    }

    // 鼠标移动事件
    handleMousemove(e: MouseEvent) {  
        const { clientX, clientY } = e;

        if (this.isOpacityDown) {
            this.changeOpacity(clientX);
        }
        if (this.isHueDown) {
            this.changHue(clientX);
        }
        if (this.isMoveDown) {
            this.changeColor(clientX, clientY);
        }
    }

    // 鼠标松开事件
    handleMouseup() {
        this.isMoveDown = false;
        this.isOpacityDown = false;
        this.isHueDown = false;
    }

    // 绑定事件
    initEvents() {
        const { colorOpacity, colorHue, colorMove } = this;
        //修改鼠标的状态
        colorMove && (colorMove.onmousedown = () => {
            this.isMoveDown = true;
        });

        colorOpacity && (colorOpacity.onmousedown = () => {
            this.isOpacityDown = true;
        });

        colorHue && (colorHue.onmousedown = () => {
            this.isHueDown = true;
        });

        //鼠标移动事件
        window.addEventListener('mousemove', this.handleMousemove.bind(this));
        window.addEventListener('mouseup', this.handleMouseup.bind(this));
    }

    // 透明度选择
    changeOpacity(clientX: number) {
        const { slideCache, colorOpacity, slideBorderWidth, proxyColor} = this;
        //获取slide元素
        let slide = slideCache.get(colorOpacity);
        if(!slide) {
            slide = colorOpacity?.querySelector<HTMLDivElement>('.outside-slide');
            slideCache.set(colorOpacity, slide);
        }
        const slideWidth = slide.offsetWidth;
        const width = (colorOpacity as HTMLDivElement).offsetWidth;
        const rect = (colorOpacity as HTMLDivElement).getBoundingClientRect();
        //计算新的 left 值
        let newLeft = clientX - rect?.left - slideBorderWidth;
        //判断边界
        newLeft = Math.min(Math.max(-slideBorderWidth, newLeft), width - slideWidth + slideBorderWidth);
        //修改元素的 left 样式
        slide.style.left = newLeft + 'px';
        //设置
        proxyColor.a = 1 - newLeft / (width - slideWidth + slideBorderWidth);
    }

    // 色相选择
    changHue(clientX: number) {
        const { colorHue, slideCache, slideBorderWidth, proxyColor} = this;
        //获取元素
        let slide = slideCache.get(colorHue);
        if(!slide) {
            slide = (colorHue as HTMLDivElement).querySelector<HTMLDivElement>('.outside-slide');
            slideCache.set(colorHue, slide);
        }
        const slideWidth = slide.offsetWidth;
        const width = (colorHue as HTMLDivElement).offsetWidth;
        const rect = (colorHue as HTMLDivElement).getBoundingClientRect();
        //计算新的 left 值
        let newLeft = clientX - rect.left - slideBorderWidth;
        //判断边界
        newLeft = Math.min(Math.max(-slideBorderWidth, newLeft), width - slideWidth + slideBorderWidth);
        //修改元素的 left 样式
        slide.style.left = newLeft + 'px';
        //设置
        proxyColor.h = newLeft / (width - slideWidth + slideBorderWidth) * 360;
    }

    // 色彩选择
    changeColor(clientX: number, clientY: number) {
         //获取元素
         const { colorMove, canvas, proxyColor } = this;
         const point = this.movePoint as HTMLDivElement;
         //鼠标距离色块的偏移量
         const rect = (colorMove as HTMLDivElement).getBoundingClientRect();
         const offsetX = clientX - rect.left;
         const offsetY = clientY - rect.top;
         //计算新的 top 值
         const offsetHeight = (colorMove as HTMLDivElement).offsetHeight;
         const offsetWidth = (colorMove as HTMLDivElement).offsetWidth;
         const radio = point.offsetHeight / 2;

         //判断边界
         const newTop = Math.min(Math.max(-radio, offsetY), offsetHeight - radio);
         const newLeft = Math.min(Math.max(-radio, offsetX), offsetWidth - radio);
         //修改元素的 top 样式
         point.style.top = newTop + 'px';
         point.style.left = newLeft + 'px';
         //计算水平方向的移动比例
         const sX = (newLeft + radio) / (canvas as HTMLCanvasElement).width;
         //设置饱和度
         proxyColor.s = sX;
         //计算垂直方向的移动比例   亮度
         const sY = (newTop + radio) / (canvas as HTMLCanvasElement).height;
         //计算当前坐标顶部的亮度
         const initL = 100 - 50 * sX;
         //设置亮度
         proxyColor.l = initL - initL * sY;
    }

    // 绘制色彩范围
    draw() {
        const { canvas, proxyColor } = this;
        //获取画笔
        const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D ;
        //设置水平方向的渐变
        const gradient = ctx?.createLinearGradient(0, 0, (canvas as HTMLCanvasElement).width, 1);
        //设置渐变的开始颜色
        gradient?.addColorStop(0, "#fff");
        gradient?.addColorStop(1, `hsl(${proxyColor.h}, 100%, 50%)`);
        //画线
        ctx.fillStyle = gradient as CanvasGradient ;
        ctx.fillRect(0,0, (canvas as HTMLCanvasElement).width, 1);

        //获取水平方向上的像素点
        const pixelData = ctx.getImageData(0, 0, (canvas as HTMLCanvasElement).width-1, 1).data;
        //遍历数组
        for (let i = 0; i < pixelData.length; i += 4) {
            // 获取数据
            const data = {
                r: pixelData[i],
                g: pixelData[i + 1],
                b: pixelData[i + 2],
                a: pixelData[i + 3]
            };
            //创建线性渐变
            const gradient = ctx.createLinearGradient(0, 0, 0, (canvas as HTMLCanvasElement).height);
            gradient.addColorStop(0, `rgb(${data.r}, ${data.g}, ${data.b})`);
            gradient.addColorStop(1, `rgb(0,0,0)`);
            //画线
            ctx.fillStyle = gradient;
            ctx.fillRect(i / 4, 0, i / 4, (canvas as HTMLCanvasElement).height-1);
        }
    }

    // 更新point的位置
    changePointPosition(hsl: Hsl) {
        const { canvas, movePoint, slideCache, colorHue, slideBorderWidth } = this;
        const radio = (movePoint as HTMLDivElement).offsetHeight / 2;

        // 饱和度反推计算movePoint在X轴方向的距离
        const offsetX = hsl.s * (canvas as HTMLCanvasElement).width;
        const newMoveLeft = offsetX - radio;
        (movePoint as HTMLDivElement).style.left = newMoveLeft + 'px';
        
        // 亮度反推计算movePoint在Y轴方向的距离
        const sX = hsl.s;
        const initL = 100 - 50 * sX;
        const sY = (initL - hsl.l * 100) / initL;
        const newTop = sY * (canvas as HTMLCanvasElement).height - radio;
        // console.log(newTop);
        (movePoint as HTMLDivElement).style.top = newTop + 'px';

        // 色相反推计算slide在colorHue上的距离
        let slide = slideCache.get(colorHue);
        if(!slide) {
            slide = (colorHue as HTMLDivElement).querySelector<HTMLDivElement>('.outside-slide');
            slideCache.set(colorHue, slide);
        }
        const width = (colorHue as HTMLDivElement).offsetWidth;
        const slideWidth = slide.offsetWidth;
        let newSlideLeft = hsl.h / 360 * (width - slideWidth + slideBorderWidth) ;
        newSlideLeft = Math.min(Math.max(-slideBorderWidth, newSlideLeft), width - slideWidth + slideBorderWidth) - slideBorderWidth;
        //修改元素的 left 样式
        slide.style.left = newSlideLeft + 'px';
        this.draw();
    }

    //修改 div 的背景颜色
    changeBg(tinyColor: any) {
        const rgbString = tinyColor['toRgbString']();
        (this.colorShow as HTMLDivElement).style.background = rgbString;
    }

    // HEX显示
    changeHex(tinyColor: any) {
        const hex = this.options?.disableOpacity ? tinyColor['toHexString']() : tinyColor['toHex8String']();
        this.hex.hex = hex;
        (this.colorHex as HTMLInputElement).value = hex.replace('#', '');
    }

    // RBG显示
    changeRgb(tinyColor: any) {
        const rgb = tinyColor['toRgb']();
        this.rgb = rgb;
        (this.colorRgbNodes.R as HTMLInputElement).value = rgb.r.toString();
        (this.colorRgbNodes.G as HTMLInputElement).value = rgb.g.toString();
        (this.colorRgbNodes.B as HTMLInputElement).value = rgb.b.toString();
    }

    // rgb转cmyk
    rgbToCmyk(rgb: Rgb) {
        const { r, g, b } = rgb;
        const r_temp = r / 255;
        const g_temp = g / 255;
        const b_temp = b / 255;
        const k = 1 - Math.max(r_temp, g_temp, b_temp);
        if(k === 1) {
            return { c: 1, y: 1, m: 1, k }
        }

        const c = (1 - r_temp - k) / (1 - k);
        const m = (1 - g_temp - k) / (1 - k);
        const y = (1 - b_temp - k) / (1 - k);
        return { c, y, m, k };
    }

    // cmyk转rgb
    cmykToRgb(cmyk: Cmyk) {
        const { c, m, y, k} = cmyk;
        const r = 255 * (1 - c) * (1 - k);
        const g = 255 * (1 - m) * (1 - k);
        const b = 255 * (1 - y) * (1 - k);
        return { r, g, b}
    }

    // CMYK显示
    changeCmyk(tinyColor: any) {
        const rgb = tinyColor['toRgb']();
        const cmyk = this.rgbToCmyk(rgb);
        this.cmyk = cmyk;
        (this.colorCmykNodes.C as HTMLInputElement).value = Math.floor(cmyk.c * 100).toString();
        (this.colorCmykNodes.M as HTMLInputElement).value = Math.floor(cmyk.m * 100).toString();
        (this.colorCmykNodes.Y as HTMLInputElement).value = Math.floor(cmyk.y * 100).toString();
        (this.colorCmykNodes.K as HTMLInputElement).value = Math.floor(cmyk.k * 100).toString();
    }

    // 更新结果
    update(tinyColor: any) {
        this.changeBg(tinyColor);
        this.changeHex(tinyColor);
        this.changeRgb(tinyColor);
        this.changeCmyk(tinyColor);
    }

    // 设置颜色
    setColor(value: number | string, colorType: string) {
        switch(colorType) {
            // hex
            case 'HEX':
                this.proxyHex.hex = `#${value}`;
                break;
            // rgb
            case 'RGB_R':
                this.proxyRgb.r = value as number
                break;
            case 'RGB_G':
                this.proxyRgb.g = value as number
            break;
            case 'RGB_B':
                this.proxyRgb.b = value as number
                break;
            // cmyk
            case 'CMYK_C':
                this.proxyCmyk.c = value as number
                break;
            case 'CMYK_M':
                this.proxyCmyk.m = value as number
                break;
            case 'CMYK_Y':
                this.proxyCmyk.y = value as number
                break;
            case 'CMYK_K':
                this.proxyCmyk.k = value as number
                break;
            default:
                break;
        }
    }

    // 限制input输入
    handleInput(target: HTMLInputElement, min: number, max: number) {
        target.oninput = (e: Event) => {
            const {target: {dataset: { colorType }}} = e;
            const currentValue = Number(target.value.replace(/[^\d]/g,''));
            const value = Math.min(Math.max(min, currentValue), max);
            target.value = value.toString();
            this.setColor(value, colorType);
        }
    }

    handleHexInput(target: HTMLInputElement) {
        target.oninput = (e: Event) => {
            const {target: {dataset: { colorType }}} = e;
            const temp = target.value.replace(/[^A-Fa-f0-9]/g,'');
            const value = temp.split('').splice(0, 6).join('');
            target.value = value;
            this.setColor(value, colorType);
        }
    }

    // 控制输入大小
    controlInput() {
        const { colorHex, colorRgbNodes, colorCmykNodes } = this;
        this.handleHexInput(colorHex as HTMLInputElement);

        this.handleInput(colorRgbNodes.R as HTMLInputElement, 0, 255);
        this.handleInput(colorRgbNodes.G as HTMLInputElement, 0, 255);
        this.handleInput(colorRgbNodes.B as HTMLInputElement, 0, 255);

        this.handleInput(colorCmykNodes.C as HTMLInputElement, 0, 100);
        this.handleInput(colorCmykNodes.M as HTMLInputElement, 0, 100);
        this.handleInput(colorCmykNodes.Y as HTMLInputElement, 0, 100);
        this.handleInput(colorCmykNodes.K as HTMLInputElement, 0, 100);
    }

    // 控制点击增加或减少
    handleClick(target: HTMLImageElement, source: HTMLInputElement, min: number, max: number, type: 'up' | 'down') {
        let out_timer: NodeJS.Timer;
        let inter_timer: NodeJS.Timer;

        const changeValue = (e: Event) => {
            const {target: {dataset: { colorType }}} = e;
            let currentValue = Number(source.value.replace(/[^\d]/g,''));
            if(type === 'up') { 
                currentValue++;
            } else {
                currentValue--;
            }
            const value = Math.min(Math.max(min, currentValue), max);
            source.value = value.toString();
            this.setColor(value, colorType);
        }

        target.onmousedown = (e: Event) => {
            out_timer = setTimeout(() => {
                inter_timer = setInterval(() => {
                    changeValue(e)
                }, 50)
            }, 500);
        }

        target.onmouseup = (e: Event) => {
            clearTimeout(out_timer);
            clearInterval(inter_timer);
            changeValue(e);
        }

        target.onmouseleave = (e: Event) => {
            clearTimeout(out_timer);
            clearInterval(inter_timer);
        }
    }

    // 点击箭头
    arrowClick() {
        const { rgbArrowNodes, colorRgbNodes } = this;
        this.handleClick(rgbArrowNodes.RUp as HTMLImageElement, colorRgbNodes.R as HTMLInputElement, 0, 255, 'up');
        this.handleClick(rgbArrowNodes.RDown as HTMLImageElement, colorRgbNodes.R as HTMLInputElement, 0, 255, 'down');
        this.handleClick(rgbArrowNodes.GUp as HTMLImageElement, colorRgbNodes.G as HTMLInputElement, 0, 255, 'up');
        this.handleClick(rgbArrowNodes.GDown as HTMLImageElement, colorRgbNodes.G as HTMLInputElement, 0, 255, 'down');
        this.handleClick(rgbArrowNodes.BUp as HTMLImageElement, colorRgbNodes.B as HTMLInputElement, 0, 255, 'up');
        this.handleClick(rgbArrowNodes.BDown as HTMLImageElement, colorRgbNodes.B as HTMLInputElement, 0, 255, 'down');
    }

    destroy() {
        window.removeEventListener('mousemove', this.handleMousemove);
        window.removeEventListener('mouseup', this.handleMouseup);
    }
}