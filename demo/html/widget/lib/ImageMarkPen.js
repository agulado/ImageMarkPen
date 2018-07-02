/*
    0.1.1
    高京
    2018-06-29
*/

const ImageMarkPen = {
    LayerShow: LayerShow_2_5_4,
    // 处理opt
    opt_assign: (opt) => {
        const opt_default = {
            Pics: '', // 图片路径。 无默认值
            z_index: 400, // 弹层的z-index。 图片/图文内容层为z_index+1。 默认400
            bg_color: '#000000', // 背景层16进制颜色。 默认 #000000
            bg_opacity: 0.8, // 背景层透明度，0～1。默认0.8
            callback_before: null, // 弹层前执行，如显示loading，无默认
            callback_success: null, // 弹层后回调，如隐藏loading，无默认
            callback_close: null // 关闭弹层后回调，无默认
        };

        return Object.assign(opt_default, opt);
    },
    // 显示弹层
    show: (opt) => {
        if (isIE678()) {
            debug.error(`ImageMarkPen 28: isIE678()`);
            return;
        }

        ImageMarkPen.opt = ImageMarkPen.opt_assign(opt);

        if (!ImageMarkPen.layerShow_ImageMarkPen)
            ImageMarkPen.layerShow_ImageMarkPen = new ImageMarkPen.LayerShow();

        ImageMarkPen.layerShow_ImageMarkPen.show({
            z_index: ImageMarkPen.opt.z_index,
            bg_color: ImageMarkPen.opt.bg_color,
            bg_opacity: ImageMarkPen.opt.bg_opacity,
            // showKind: 1-图片 | 2-HTML。默认1
            Pics: [ImageMarkPen.opt.Pics], // showKind= 1 时有效。 图片路径列表， 数组。 如["/images/001.jpg", "/images/002.png"]。 无默认值
            // Pics_show_index: 默认显示图片的序号， 值大于等于图片数组的length时无效。 默认0
            // Pics_scroll_speed: showKind = 1 时有效。 图片切换时的速度。 毫秒。 默认500。 移动端建议设置为100 - 200， 过慢会有卡顿的现象
            // Pics_arrow_left: showKind = 1 时有效。 图片切换 左箭头图片路径。 默认 / inc / LayerShow_arrow_left.png。
            // Pics_arrow_right: showKind = 1 时有效。 图片切换 右箭头图片路径。 默认 / inc / LayerShow_arrow_left.png。
            // Pics_scale_fit: showKind = 1 且非ie678时有效。 图片自动缩小到适配尺寸。 true(默认) - 无论图片多大， 都可以全屏显示完整， 不监听拖拽事件； false - 图片原尺寸显示， 拖拽时可改变显示位置(类似图片放大镜的效果)
            // Pics_preload_all: showKind = 1 时有效。 图片预加载所有大图， 移动端建议false(以免图片加载太多影响打开)， pc端建议true(ie不支持svg)。 默认true。
            Pics_close_show: false,
            // Pics_close_path: 关闭按钮图片路径。 默认 / inc / LayerShow_close.png。
            callback_image_click: function(e) {
                debug.debug(`ImageMarkPen 43: `);
                debug.debug(e);
            },
            callback_before: ImageMarkPen.opt.callback_before,
            callback_success: ImageMarkPen.opt.callback_success, // 弹层成功(showKind = 1 时只加载了第一张图片)。 回调function(_obj)。 showKind = 1 时_obj为加载的第一且是唯一一张图片的li盒； showKind = 2 时_obj为实例化的jroll对象； 如info_box_use_JRoll为false， 则_obj = undefined。 无默认
            callback_close: ImageMarkPen.opt.callback_close // 关闭弹层后的回调。 info_wrapper_html为showKind = 2 时， $("#info_wrapper").html()。 无默认
        });
    }
};

// var insert_keyframe = function(style) {
//     var _obj = document.styleSheets[0];
//     if (_obj.insertRule)
//         _obj.insertRule(style, 0);
//     else
//         _obj.appendRule(style, 0);
// };

/*
    https://github.com/TopuNet/LayerShow/tree/2.5.4

    * 删除
     ** 不必要的盒
     ** Kind=2部分
     ** 所有关于IE678的判断（放到ImageMarkPen.show()时判断）。
     ** 图片的横向移动方法

    * 增加
     ** dom_button_li 操作按钮层
*/
function LayerShow_2_5_4() {
    var action_colors = ["#fc3746", "#fd6096", "#d05ace", "#21aad4", "#17a249", "#fece5b", "#fc673b", "#999999", "#000000", "#eeeeee"]
    action_fontSizes = [9, 10, 11, 12, 13, 14, 18, 24, 36, 48, 64, 72, 96];
    return {
        // 图片尺寸占window的比例
        image_size_percent_from_window_width: 0.95,
        image_size_percent_from_window_height: 0.95,
        button_height_px: 40,
        img_obj: null,
        img_size: null,
        action_colors: action_colors,
        button_color_default: "#333",
        button_color_disable: "#aaa",
        button_box_minWidth_px: 430,
        canvas_record_now_index: -1,
        canvas_record: [],
        action: "",
        action_color: action_colors[0],
        action_lineWidth_a: 3,
        action_lineWidth_b: 6,
        action_lineWidth_c: 9,
        action_lineWidth: 3,
        action_fontSizes: action_fontSizes,
        action_fontSize: 14,

        // 标记是否正在执行图片切换
        image_sliding: false,

        // 创建DOM
        create_dom: function() {

            var _this = this;
            var dom_body = $("body");

            // 背景层
            _this.dom_bg_layer = $(document.createElement("div"))
                .css({
                    "position": "fixed",
                    "top": 0,
                    "left": 0,
                    "opacity": 0,
                    "filter": "alpha(opacity=0)",
                    "-moz-opacity": 0
                })
                .appendTo(dom_body);

            // 内容层
            _this.dom_info_box = $(document.createElement("div"))
                .attr("id", "info_wrapper")
                .css({
                    "position": "fixed",
                    "display": "none",
                    "top": "0",
                    "left": "0",
                    "padding": "0",
                    "margin": "0"
                })
                .appendTo(dom_body);

            // 图片层
            _this.dom_image_box = $(document.createElement("div"))
                .css({
                    "position": "fixed",
                    "overflow": "hidden",
                    "top": "0",
                    "left": "0"
                })
                .appendTo(dom_body);

            // 图片ul盒
            _this.dom_image_ul = $(document.createElement("ul"))
                .css({
                    "position": "absolute",
                    "list-style": "none",
                    "padding": 0,
                    "margin": 0,
                    "z-index": _this.Paras.z_index + 1
                })
                .appendTo(_this.dom_image_box);

            // 图片li盒
            _this.dom_image_li = $(document.createElement("li"))
                .css({
                    "overflow": "hidden",
                    "position": "relative"
                }).appendTo(_this.dom_image_ul);

            // 图片盒
            _this.dom_image = $(document.createElement("canvas")).css({
                "position": "absolute",
                "top": "50%",
                "left": "50%"
            }).appendTo(_this.dom_image_li);

            // 操作按钮盒
            _this.dom_button_li = $(document.createElement("li"))
                .css({
                    "height": _this.button_height_px + "px",
                    "background": "#fff",
                    "border-radius": "3px",
                    "border": "#333",
                    "margin": "0 auto",
                    // "overflow": "hidden",
                    "position": "relative"
                }).appendTo(_this.dom_image_ul);

            // 按钮
            var i = 0;
            var left = 18;
            var right = 10;
            var width = 20;

            // 按钮-标记当前使用(显示时append到按钮盒中)
            _this.dom_button_now_flag = $(document.createElement("span"))
                .css({
                    "width": "4px",
                    "height": "4px",
                    "border-radius": "2px",
                    "position": "absolute",
                    "top": "22px",
                    "left": "50%",
                    "margin-left": "-2px",
                    "background": _this.action_color
                });

            // 按钮-矩形
            _this.dom_button_rect = $(document.createElement("div"))
                // .addClass("button_rect")
                .css({
                    "cursor": "pointer",
                    "position": "absolute",
                    "width": width + "px",
                    "height": width + "px",
                    "border": "solid 1px " + _this.button_color_default,
                    "border-radius": "3px",
                    "top": "10px",
                    "left": ((left + width) * (i++) + left + 5) + "px"
                }).appendTo(_this.dom_button_li);

            // 按钮-圆形
            _this.dom_button_circle = _this.dom_button_rect.clone()
                // .attr("class", "")
                // .addClass("button_circle")
                .css({
                    "left": ((left + width) * (i++) + left + 5) + "px",
                    "border-radius": "10px"
                }).appendTo(_this.dom_button_li);

            // 按钮-铅笔
            _this.dom_button_pencil = _this.dom_button_rect.clone()
                // .attr("class", "")
                // .addClass("button_pencil")
                .css({
                    "left": ((left + width) * (i++) + left + 5) + "px",
                    "border": "none"
                }).html(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 170">
                    <path d="M182.1,47.4,155.5,20.8c-5.3-5.3-12.4-5.3-17.7,0L39.6,119,25.9,168.1c-1.3,6.6,2.3,10.2,8.8,8.8l49.1-13.7L182,65C187.4,59.7,187.4,52.7,182.1,47.4ZM39.1,163.8,49.3,127l26.6,26.6L39.1,163.8Zm45.6-19.1L58.1,118.1l57.6-57.6,26.6,26.6L84.7,144.7Zm66.4-66.4L124.5,51.7,142.2,34c4.5-4.5,4.5-4.5,8.9,0l17.7,17.7c4.5,4.5,4.5,4.5,0,8.9Z" transform="translate(-25.64 -16.82)" style="fill:${_this.button_color_default}" /></svg>
                `)
                .appendTo(_this.dom_button_li);

            // 按钮-字符
            _this.dom_button_char = _this.dom_button_rect.clone()
                // .attr("class", "")
                // .addClass("button_char")
                .css({
                    "height": "20px",
                    "top": "10px",
                    "left": ((left + width) * (i++) + left + 3) + "px",
                    "border": "none",
                    "font-family": "Athelas",
                    "color": _this.button_color_default,
                    "font-size": "25px"
                    // "text-align": "center"
                }).appendTo(_this.dom_button_li);
            $(document.createElement("span"))
                .css({
                    "position": "absolute",
                    "top": "-4px",
                    "left": "2px"
                }).text("T").appendTo(_this.dom_button_char);

            i = 0;
            // 按钮-确定
            _this.dom_button_radic = _this.dom_button_pencil.clone()
                // .attr("class", "")
                // .addClass("button_radic button_disable nohl")
                .css({
                    "top": "8px",
                    "left": "auto",
                    "right": ((right + width) * (i++) + right + 5) + "px",
                }).html(`
                    <svg t="1530266623983" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1129" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width+5}" height="${width+5}">
                    <path style="fill:${_this.button_color_disable};" d="M364.037087 836.187497c-5.176906 0-10.354835-1.954515-14.334473-5.872754l-1.402953-1.381463c-0.103354-0.102331-0.205685-0.204661-0.306992-0.309038L66.585511 539.439956c-7.869225-8.087189-7.693216-21.022803 0.393973-28.892027 8.086166-7.867178 21.021779-7.692193 28.891004 0.393973l268.255627 275.66948 565.584406-571.97086c7.934716-8.023744 20.87033-8.096399 28.893051-0.162706 8.024767 7.933693 8.096399 20.87033 0.162706 28.894074L378.565988 830.122361C374.569978 834.162374 369.304044 836.187497 364.037087 836.187497z" p-id="1130"></path></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-取消
            _this.dom_button_cancel = _this.dom_button_radic.clone()
                // .attr("class", "")
                // .addClass("button_cancel nohl")
                .css({
                    "top": "9px",
                    "right": ((right + width) * (i++) + right + 3) + "px",
                }).html(`
                    <svg t="1522138148259" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2386" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width+3}" height="${width+3}">
                    <path d="M176.661601 817.172881C168.472798 825.644055 168.701706 839.149636 177.172881 847.338438 185.644056 855.527241 199.149636 855.298332 207.338438 846.827157L826.005105 206.827157C834.193907 198.355983 833.964998 184.850403 825.493824 176.661601 817.02265 168.472798 803.517069 168.701706 795.328267 177.172881L176.661601 817.172881Z" p-id="2387" style=" fill:${_this.button_color_default};"></path>
                    <path d="M795.328267 846.827157C803.517069 855.298332 817.02265 855.527241 825.493824 847.338438 833.964998 839.149636 834.193907 825.644055 826.005105 817.172881L207.338438 177.172881C199.149636 168.701706 185.644056 168.472798 177.172881 176.661601 168.701706 184.850403 168.472798 198.355983 176.661601 206.827157L795.328267 846.827157Z" p-id="2388" style=" fill:${_this.button_color_default};"></path></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-恢复
            _this.dom_button_redo = _this.dom_button_radic.clone()
                // .attr("class", "")
                // .addClass("button_redo button_disable nohl")
                .css({
                    // "cursor": "default",
                    "top": "10px",
                    "right": ((right + width) * (i++) + right + 1) + "px",
                }).html(`
                    <svg t="1530265968613" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1668" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${width}">
                    <path d="M127.5904 229.888c82.176-82.176 191.488-127.488 307.712-127.488s225.536 45.2608 307.712 127.488 127.488 191.488 127.488 307.712l0 66.2016 109.8752-109.8752c9.984-9.984 26.2144-9.984 36.1984 0s9.984 26.2144 0 36.1984l-153.6 153.6c-5.0176 5.0176-11.5712 7.4752-18.1248 7.4752s-13.1072-2.5088-18.1248-7.4752l-153.6-153.6c-9.984-9.984-9.984-26.2144 0-36.1984s26.2144-9.984 36.1984 0l109.8752 109.8752 0-66.2016c0-211.7632-172.2368-384-384-384s-384 172.2368-384 384c0 211.7632 172.2368 384 384 384 14.1312 0 25.6 11.4688 25.6 25.6s-11.4688 25.6-25.6 25.6c-116.224 0-225.536-45.2608-307.712-127.488s-127.488-191.488-127.488-307.712c0-116.224 45.2608-225.536 127.488-307.712z" p-id="1669" style=" fill:${_this.button_color_disable};"></path></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-重做
            _this.dom_button_undo = _this.dom_button_redo.clone()
                // .attr("class", "")
                // .addClass("button_undo button_disable nohl")
                .css({
                    // "cursor": "default",
                    "top": "12px",
                    "right": ((right + width) * (i++) + right + 5) + "px",
                }).html(`
                    <svg viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1668" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${width}">
                    <path d="M174,44.9a82.87,82.87,0,0,0-118.44,0A85.11,85.11,0,0,0,31,105v12.93L9.87,96.47a4.88,4.88,0,0,0-7,0,5.06,5.06,0,0,0,0,7.07l29.56,30a4.9,4.9,0,0,0,7,0l29.56-30a5.06,5.06,0,0,0,0-7.07,4.88,4.88,0,0,0-7,0L40.89,117.93V105c0-41.36,33.15-75,73.9-75s73.9,33.64,73.9,75-33.15,75-73.9,75a5,5,0,0,0,0,10A82.57,82.57,0,0,0,174,165.1a85.87,85.87,0,0,0,0-120.2Z" transform="translate(-1.46 -20)" style="fill:${_this.button_color_disable}"/></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-分隔线
            _this.dom_button_split = _this.dom_button_radic.clone()
                .attr("class", "")
                .addClass("button_split")
                .css({
                    "top": "10px",
                    "cursor": "default",
                    "right": ((right + width) * (i++) + right - 7) + "px",
                }).html(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                    <path d="M95,0h10V200H95Z" transform="translate(-95)" style="fill:${_this.button_color_disable}"/></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-放大
            _this.dom_button_larger = _this.dom_button_radic.clone()
                // .attr("class", "")
                // .addClass("button_arger nohl")
                .css({
                    "top": "10px",
                    "right": ((right + width) * (i++) + right) + "px",
                }).html(`
                    <svg t="1530269903040" class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1962" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${width}">
                    <path style="fill:${_this.button_color_default}" d="M950.349 925.799l-166.19-166.187a416.683 416.683 0 0 1-26.635 26.635l166.188 166.189c7.355 7.353 19.279 7.353 26.637 0 7.353-7.357 7.353-19.282 0-26.637zM478.156 103.561c-208.036 0-376.682 168.646-376.682 376.684 0 208.034 168.646 376.68 376.682 376.68s376.682-168.646 376.682-376.68c0-208.038-168.646-376.684-376.682-376.684z m0 715.697c-187.232 0-339.014-151.784-339.014-339.014 0-187.233 151.782-339.014 339.014-339.014S817.17 293.011 817.17 480.244c0 187.23-151.782 339.014-339.014 339.014zM647.663 461.41H496.99V310.736c0-10.4-8.432-18.832-18.834-18.832s-18.832 8.432-18.832 18.832V461.41H308.649c-10.4 0-18.834 8.43-18.834 18.834 0 10.4 8.434 18.832 18.834 18.832h150.675v150.673c0 10.404 8.43 18.836 18.832 18.836 10.402 0 18.834-8.432 18.834-18.836V499.077h150.673c10.404 0 18.836-8.432 18.836-18.832 0-10.405-8.432-18.835-18.836-18.835z" p-id="1963"></path></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-缩小
            _this.dom_button_smaller = _this.dom_button_larger.clone()
                // .attr("class", "")
                // .addClass("button_smaller button_disable nohl")
                .css({
                    // "cursor": "default",
                    "right": ((right + width) * (i++) + right) + "px",
                }).html(`
                    <svg t="1530269903040" class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1962" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${width}">
                    <path style="fill:${_this.button_color_disable}" d="M479.604 103.525c-207.839 0-376.327 168.488-376.327 376.331 0 207.839 168.488 376.327 376.327 376.327 207.841 0 376.331-168.488 376.331-376.327 0-207.842-168.49-376.331-376.331-376.331z m0 715.028c-187.056 0-338.696-151.642-338.696-338.696 0-187.058 151.64-338.696 338.696-338.696 187.058 0 338.696 151.638 338.696 338.696 0 187.054-151.638 338.696-338.696 338.696z m471.749 106.441L785.32 758.961a416.71 416.71 0 0 1-26.611 26.611L924.74 951.606c7.35 7.346 19.264 7.346 26.612 0 7.349-7.35 7.349-19.264 0.001-26.612zM648.954 461.04H310.257c-10.392 0-18.818 8.422-18.818 18.816 0 10.39 8.426 18.815 18.818 18.815h338.696c10.391 0 18.815-8.424 18.815-18.815 0-10.394-8.424-18.816-18.814-18.816z" p-id="959"></path></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-拖拽
            _this.dom_button_drag = _this.dom_button_larger.clone()
                // .attr("class", "")
                // .addClass("button_drag button_disable")
                .css({
                    // "cursor": "default",
                    "right": ((right + width) * (i++) + right) + "px",
                }).html(`
                    <svg t="1530269903040" class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1962" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${width}">
                    <path style="fill:${_this.button_color_disable}" d="M876.544 530.432h-272.384c-12.288 0-20.48-8.192-20.48-20.48s8.192-20.48 20.48-20.48h272.384l-112.64-112.64c-8.192-8.192-8.192-20.48 0-28.672 8.192-8.192 20.48-8.192 28.672 0l145.408 145.408c2.048 2.048 4.096 6.144 6.144 10.24 2.048 8.192 2.048 16.384-4.096 22.528l-145.408 145.408c-8.192 8.192-20.48 8.192-28.672 0-8.192-8.192-8.192-20.48 0-28.672l110.592-112.64z m-741.376 0l110.592 110.592c8.192 8.192 8.192 20.48 0 28.672-8.192 8.192-20.48 8.192-28.672 0l-145.408-145.408c-6.144-6.144-8.192-14.336-4.096-22.528 0-4.096 2.048-6.144 6.144-10.24l145.408-145.408c8.192-8.192 20.48-8.192 28.672 0 8.192 8.192 8.192 20.48 0 28.672l-112.64 112.64h272.384c12.288 0 20.48 8.192 20.48 20.48s-8.192 20.48-20.48 20.48h-272.384z m356.352 335.872v-272.384c0-12.288 8.192-20.48 20.48-20.48s20.48 8.192 20.48 20.48v272.384l112.64-112.64c8.192-8.192 20.48-8.192 28.672 0 8.192 8.192 8.192 20.48 0 28.672l-145.408 145.408c-2.048 2.048-6.144 4.096-10.24 6.144-8.192 2.048-16.384 2.048-22.528-4.096l-145.408-145.408c-8.192-8.192-8.192-20.48 0-28.672 8.192-8.192 20.48-8.192 28.672 0l112.64 110.592z m0-720.896l-110.592 110.592c-8.192 8.192-20.48 8.192-28.672 0-8.192-8.192-8.192-20.48 0-28.672l145.408-145.408c6.144-6.144 14.336-8.192 22.528-4.096 4.096 0 6.144 2.048 10.24 6.144l145.408 145.408c8.192 8.192 8.192 20.48 0 28.672-8.192 8.192-20.48 8.192-28.672 0l-112.64-112.64v272.384c0 12.288-8.192 20.48-20.48 20.48s-20.48-8.192-20.48-20.48v-272.384z" p-id="6815"></path></svg>
                `).appendTo(_this.dom_button_li);

            // 按钮-分隔线
            _this.dom_button_split_2 = _this.dom_button_split.clone()
                .attr("class", "")
                .addClass("button_split")
                .css({
                    "right": ((right + width) * (i++) + right - 13) + "px",
                }).html(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                    <path d="M95,0h10V200H95Z" transform="translate(-95)" style="fill:${_this.button_color_disable}"/></svg>
                `).appendTo(_this.dom_button_li);

            // 样式栏
            _this.dom_styleArea = $(document.createElement("div"))
                .addClass("styleArea")
                .css({
                    "height": (_this.button_height_px * 4 / 5) + "px",
                    "background": "#fff",
                    "border-radius": "3px",
                    "border": "#333",
                    "position": "absolute",
                    "top": (-_this.button_height_px) + "px"
                }).appendTo(_this.dom_button_li);

            // 样式栏三角
            _this.dom_styleArea_arrow = $(document.createElement("span"))
                .css({
                    "position": "absolute",
                    "width": "0",
                    "height": "0",
                    "border-top": "solid " + (_this.button_height_px * 1 / 10) + "px #fff",
                    "border-left": "solid " + (_this.button_height_px * 1 / 10) + "px transparent",
                    "border-right": "solid " + (_this.button_height_px * 1 / 10) + "px transparent",
                    "top": _this.dom_styleArea.css("height")
                }).appendTo(_this.dom_styleArea);

            // 样式栏按钮-列表
            _this.dom_styleArea_button_ul = $(document.createElement("ul"))
                .css({
                    "margin-top": "6px"
                }).appendTo(_this.dom_styleArea);

            // 样式栏按钮-收起
            _this.dom_styleArea_button_retract = $(document.createElement("li"))
                .css({
                    "cursor": "pointer",
                    "float": "left",
                    "margin-left": `${_this.dom_styleArea_arrow.css("border-top-width").replace("px", "")*2+1}px`,
                    "width": `${width}px`,
                    "height": `${width}px`,
                    "transform": "rotate(180deg)"
                }).appendTo(_this.dom_styleArea_button_ul)
                .html(`
                        <svg t="1530500805732" class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2401" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${width}">
                        <path style="fill:${_this.button_color_disable}" d="M512 128c212 0 384 172 384 384S724 896 512 896 128 724 128 512s172-384 384-384m0-64C264.8 64 64 264.8 64 512s200.8 448 448 448 448-200.8 448-448S759.2 64 512 64z m272 530.4L557.6 368 512 322.4 466.4 368 240 594.4l45.6 45.6L512 413.6 738.4 640l45.6-45.6z" p-id="2402"></path></svg>
                    `);

            // 样式栏按钮-笔触
            _this.dom_styleArea_button_width_panel = $(document.createElement("li"))
                .css({
                    "float": "left",
                    "height": `${width}px`,
                    "text-align": "left",
                    "vertical-align": "middle"
                }).appendTo(_this.dom_styleArea_button_ul);

            // 样式栏按钮-笔触-1
            _this.dom_styleArea_button_width_a = $(document.createElement("span"))
                .css({
                    "float": "left",
                    "width": `6px`,
                    "height": `6px`,
                    "margin-top": "6px",
                    "margin-left": "20px",
                    "border-radius": `3px`,
                }).appendTo(_this.dom_styleArea_button_width_panel);

            // 样式栏按钮-笔触-2
            _this.dom_styleArea_button_width_b = _this.dom_styleArea_button_width_a.clone()
                .css({
                    "width": "12px",
                    "height": "12px",
                    "margin-top": "3px",
                    "border-radius": "6px",
                }).appendTo(_this.dom_styleArea_button_width_panel);

            // 样式栏按钮-笔触-3
            _this.dom_styleArea_button_width_c = _this.dom_styleArea_button_width_a.clone()
                .css({
                    "width": "16px",
                    "height": "16px",
                    "margin-top": "1px",
                    "border-radius": "8px",
                }).appendTo(_this.dom_styleArea_button_width_panel);

            // 样式栏按钮-颜色
            _this.dom_styleArea_button_color_panel = $(document.createElement("li"))
                .css({
                    "cursor": "pointer",
                    "float": "left",
                    "margin-left": "20px",
                    "width": "50px",
                    "height": "20px",
                    "position": "relative"
                }).appendTo(_this.dom_styleArea_button_ul);

            // 样式栏按钮-颜色-选择列表
            _this.dom_styleArea_button_color_selector = $(document.createElement("ul"))
                .css({
                    "position": "absolute",
                    "width": _this.dom_styleArea_button_color_panel.css("width"),
                    "height": `${(20+5)*_this.action_colors.length+10}px`,
                    "left": "0",
                    "bottom": "0",
                    "border": `solid 1px ${_this.button_color_default}`,
                    "border-radius": "5px 5px 0 0",
                    "background": "#fff"
                }).appendTo(_this.dom_styleArea_button_color_panel);

            // 样式栏按钮-颜色-选择列表-li
            _this.dom_styleArea_button_color_selector_li = $(document.createElement("li"))
                .css({
                    "margin": "5px",
                    "border": `solid 1px ${_this.button_color_disable}`,
                    "height": `20px`
                });
            _this.action_colors.forEach(function(color) {
                _this.dom_styleArea_button_color_selector_li.clone().css({
                    "background": color
                }).appendTo(_this.dom_styleArea_button_color_selector);
            });

            // 图片容器盒（放置图片的盒）
            _this.dom_image_li_image = $(document.createElement("div"));

            // 按钮样式初始化
            _this.button_resetStyle.apply(_this);

            // 按钮监听
            _this.button_Listener.apply(_this);
        },

        // canvas记录操作历史，用于undo和redo
        // @params: {img,x,y,width,height,radius,x_moveTo,y_moveTo}
        canvas_add: function(act, params) {
            var _this = this;

            // 将undo的操作记录删掉
            debug.debug("ImageMarkPen 348:");
            debug.debug(` canvas_record.length=${_this.canvas_record.length}; canvas_now_index=${_this.canvas_record_now_index}`);

            if (_this.canvas_record.length > _this.canvas_record_now_index)
                _this.canvas_record.splice(_this.canvas_record_now_index + 1, _this.canvas_record.length - _this.canvas_record_now_index - 1);

            params.color = _this.action_color;
            params.lineWidth = _this.action_lineWidth;

            _this.canvas_record.push({
                "act": act,
                "params": params
            });
            debug.debug(`ImageMarkPen 350: canvas_record_now_index=${this.canvas_record_now_index}`);
            if (++_this.canvas_record_now_index > 0) {
                _this.dom_button_undo.removeClass("button_disable")
                    .css("cursor", "pointer")
                    .find("svg path").css("fill", _this.button_color_default);
            }

            _this.dom_button_redo.attr("class", "button_redo button_disable nohl").css("cursor", "default").find("path").css("fill", _this.button_color_disable);

            _this.canvas_draw(_this.ctx, act, params);

            debug.debug(`ImageMarkPen 535: canvas_record_now_index=${_this.canvas_record_now_index}, canvas_record=`);
            debug.debug(_this.canvas_record);
        },

        // canvas执行绘画
        canvas_draw: function(ctx, act, params) {
            ctx.strokeStyle = params.color;
            ctx.fillStyle = params.color;
            ctx.lineWidth = params.lineWidth;
            switch (act) {
                case "drawImage":
                    ctx.drawImage(params.img, params.x, params.y, params.width, params.height);
                    break;
                case "rect":
                    ctx.strokeRect(params.x, params.y, params.width, params.height);
                    break;
                case "circle":
                    ctx.beginPath();
                    ctx.arc(params.x, params.y, params.radius, 0, 360);
                    ctx.stroke();
                    break;
                case "pencil":
                    ctx.beginPath();
                    ctx.moveTo(params.x, params.y);
                    ctx.lineTo(params.x_moveTo, params.y_moveTo);
                    ctx.closePath();
                    ctx.stroke();
                default:
                    break;
            }
        },

        // canvas undo
        canvas_undo: function() {
            var _this = this;

            debug.debug(`ImageMarkPen 381: undo`);

            if (--_this.canvas_record_now_index < 0) {
                _this.canvas_record_now_index = -1;
                return;
            } else if (_this.canvas_record_now_index === 0) {
                _this.dom_button_undo.addClass("button_disable")
                    .css("cursor", "default")
                    .find("svg path").css("fill", _this.button_color_disable);
            }

            _this.dom_button_redo.attr("class", "button_redo nohl").css("cursor", "pointer").find("path").css("fill", _this.button_color_default);

            _this.ctx.clearRect(0, 0, _this.img_size.img_width, _this.img_size.img_height);

            for (var i = 0; i <= _this.canvas_record_now_index; i++) {
                _this.canvas_draw(_this.ctx, _this.canvas_record[i].act, _this.canvas_record[i].params);
            }

        },

        // canvas redo
        canvas_redo: function() {
            var _this = this;

            debug.debug(`ImageMarkPen 421: redo`);

            if (_this.canvas_record_now_index >= _this.canvas_record.length - 1)
                return;

            var cr = _this.canvas_record[++_this.canvas_record_now_index];
            _this.canvas_draw(_this.ctx, cr.act, cr.params);

            if (_this.canvas_record_now_index >= _this.canvas_record.length - 1) {
                _this.dom_button_redo.attr("class", "button_redo button_disable nohl").css("cursor", "default").find("path").css("fill", _this.button_color_disable);
            }

            _this.dom_button_undo.attr("class", "button_undo nohl").css("cursor", "pointer").find("path").css("fill", _this.button_color_default);
        },

        // 按钮样式重置
        button_resetStyle: function() {
            var _this = this;

            if (!_this.dom_button_li)
                return;

            _this.dom_button_rect.attr("class", "button_rect").css("border-color", _this.button_color_default);
            _this.dom_button_circle.attr("class", "button_circle").css("border-color", _this.button_color_default);
            _this.dom_button_pencil.attr("class", "button_pencil").find("path").css("fill", _this.button_color_default);
            _this.dom_button_char.attr("class", "button_char").css("color", _this.button_color_default);
            _this.dom_button_radic.attr("class", "button_radic button_disable nohl");
            _this.dom_button_cancel.attr("class", "button_cancel nohl");
            _this.dom_button_redo.attr("class", "button_redo button_disable nohl").css({ "cursor": "default" });
            _this.dom_button_undo.attr("class", "button_undo button_disable nohl").css({ "cursor": "default" });
            _this.dom_button_larger.attr("class", "button_larger nohl");
            _this.dom_button_smaller.attr("class", "button_smaller button_disable nohl").css({ "cursor": "default" });
            _this.dom_button_drag.attr("class", "button_drag button_disable").css({ "cursor": "default" }).find("path").css("fill", _this.button_color_default);
            _this.dom_button_now_flag.css({ "display": "none" });

            _this.action = "";
            _this.action_color = _this.action_colors[0];
            _this.action_lineWidth = _this.action_lineWidth_a;

            _this.styleArea_resetStyle.apply(_this);

        },

        // styleArea 按钮样式重置
        styleArea_resetStyle: function() {
            var _this = this;
            _this.dom_styleArea.css({ "display": "none" });
            _this.dom_styleArea_button_width_panel.css({ "display": "none" });
            _this.dom_styleArea_button_width_a.css({
                "cursor": `${_this.action_lineWidth==_this.action_lineWidth_a?"default":"pointer"}`,
                "background": `${_this.action_lineWidth==_this.action_lineWidth_a?_this.action_color:_this.button_color_disable}`
            });
            _this.dom_styleArea_button_width_b.css({
                "cursor": `${_this.action_lineWidth==_this.action_lineWidth_b?"default":"pointer"}`,
                "background": `${_this.action_lineWidth==_this.action_lineWidth_b?_this.action_color:_this.button_color_disable}`
            });
            _this.dom_styleArea_button_width_c.css({
                "cursor": `${_this.action_lineWidth==_this.action_lineWidth_c?"default":"pointer"}`,
                "background": `${_this.action_lineWidth==_this.action_lineWidth_c?_this.action_color:_this.button_color_disable}`
            });
            _this.dom_styleArea_button_color_panel.css({
                "display": "none",
                "background": `${_this.action_color}`
            });
            _this.dom_styleArea_button_color_selector.css({
                "display": "none"
            });
        },

        // 按钮修改高亮状态 @button: $(obj); @hl: true|else
        button_changeHighLight: function(button, hl) {
            var _this = this;
            var color = hl === true ? _this.action_color : _this.button_color_default;
            if (button.find("path").length > 0)
                button.find("path").css("fill", color);
            else
                button.css({
                    "border-color": color,
                    "color": color
                });
        },

        // 样式栏显示
        // @hl_button_obj: 当前高亮按钮对象
        styleArea_show: function(hl_button_obj) {
            var _this = this,
                width_px,
                styles = [];
            switch (hl_button_obj) {
                case _this.dom_button_rect:
                case _this.dom_button_circle:
                case _this.dom_button_pencil:
                    width_px = 210;
                    styles = ["lineWidth", "color"];
                    break;
                default:
                    break;
            }

            _this.styleArea_resetStyle.apply(_this);

            styles.forEach(function(style) {
                switch (style) {
                    case "lineWidth":
                        _this.dom_styleArea_button_width_panel.css({
                            "display": "block"
                        });
                        break;
                    case "color":
                        _this.dom_styleArea_button_color_panel.css({
                            "display": "block"
                        });
                        break;
                    default:
                        break;
                }
            });

            _this.dom_styleArea.css({
                "display": "block",
                "width": width_px + "px",
                "left": `${hl_button_obj.css("left").replace("px", "") - _this.dom_styleArea_arrow.css("border-top-width").replace("px", "")*2}px`
            });

            _this.dom_styleArea_arrow.css({
                "left": `${hl_button_obj.width() / 2+~~_this.dom_styleArea_arrow.css("border-top-width").replace("px", "")+1}px`
            });

            _this.styleArea_button_Listener.apply(_this);
        },

        // 样式栏按钮监听
        styleArea_button_Listener: function() {
            var _this = this;
            var hover_handler = function(obj) {
                if (obj.css("cursor") == "default")
                    return;

                if (obj.find("path").length > 0) {
                    obj.find("path").css({
                        "fill": _this.button_color_default
                    });
                } else {
                    obj.css({
                        "background": _this.button_color_default
                    });
                }
            };
            var out_handler = function(obj) {
                if (obj.css("cursor") == "default")
                    return;

                if (obj.find("path").length > 0) {
                    obj.find("path").css({
                        "fill": _this.button_color_disable
                    });
                } else {
                    obj.css({
                        "background": _this.button_color_disable
                    });
                }
            };

            // 收起
            _this.dom_styleArea_button_retract.unbind("mouseover").on("mouseover", function() {
                hover_handler($(this));
            }).unbind("mouseout").on("mouseout", function() {
                out_handler($(this));
            }).unbind("click").on("click", function() {
                debug.log(`ImageMarkPen 751: 收起按钮 click`);
                _this.dom_styleArea.css({
                    "display": "none"
                });
            });

            // lineWidth
            _this.dom_styleArea_button_width_panel.find("span").unbind("click").on("click", function() {
                debug.log(`ImageMarkPen 759: lineWidth按钮 click`);
                switch ($(this).index()) {
                    case 0:
                        _this.action_lineWidth = 3;
                        break;
                    case 1:
                        _this.action_lineWidth = 6;
                        break;
                    case 2:
                        _this.action_lineWidth = 9;
                        break;
                    default:
                        break;
                }
                $(this).css({
                    "cursor": "default",
                    "background": _this.action_color
                }).siblings().css({
                    "cursor": "pointer",
                    "background": _this.button_color_disable
                });
            });

            // color
            _this.dom_styleArea_button_color_panel.unbind("click").on("click", function(e) {
                debug.log(`ImageMarkPen 784: 颜色按钮 click`);
                e.stopPropagation();
                _this.dom_styleArea_button_color_selector.css("display", "block");

                $(window).one("click", function() {
                    _this.dom_styleArea_button_color_selector.css("display", "none");
                });
            }).find("li").unbind("click").on("click", function(e) {
                e.stopPropagation();
                _this.action_color = _this.action_colors[$(this).index()];
                debug.log(`ImageMarkPen 794: 颜色 click：${_this.action_color}`);
                // 颜色色块
                _this.dom_styleArea_button_color_panel.css({
                    "background-color": _this.action_color
                });
                // 宽度颜色
                var width_buttons = _this.dom_styleArea_button_width_panel.find("span");
                var width_button;
                for (var i = 0, len = width_buttons.length; i < len; i++) {
                    width_button = $(width_buttons[i]);
                    if (width_button.css("cursor") == "default") {
                        width_button.css({
                            "background-color": _this.action_color
                        });
                        break;
                    }
                }

                // 按钮颜色
                var button_now = _this.dom_button_li.find(".button_now");
                if (button_now.find("path").length === 0) {
                    button_now.css({
                        "border-color": _this.action_color,
                        "color": _this.action_color
                    });
                } else {
                    button_now.find("path").css({
                        "fill": _this.action_color
                    });
                }

                // 按钮使用中标记颜色
                _this.dom_button_now_flag.css({
                    "background": _this.action_color
                });

                // 隐藏颜色选择列表
                _this.dom_styleArea_button_color_selector.css("display", "none");
            });
        },

        // 按钮监听
        button_Listener: function() {
            var _this = this;
            var buttons = _this.dom_button_li.find("div:not(.button_split,.styleArea,.button_style)");
            buttons.unbind().on("mouseover", function() {
                // debug.debug("ImageMarkPen 404: ");
                // debug.debug($(this).hasClass("button_disable"));
                if ($(this).hasClass("button_disable"))
                    return;
                _this.button_changeHighLight.apply(_this, [$(this), true]);
            }).on("mouseout", function() {
                if ($(this).hasClass("button_now") || $(this).hasClass("button_disable"))
                    return;

                _this.button_changeHighLight.apply(_this, [$(this), false]);

            }).on("click", function() {

                debug.log(`ImageMarkPen 849 button_Listener(): button click`);

                if ($(this).hasClass("nohl") || $(this).hasClass("button_disable"))
                    return;
                var now = $(this).siblings(".button_now");
                now.removeClass("button_now");
                _this.button_changeHighLight.apply(_this, [now, false]);
                $(this).addClass("button_now");
                _this.button_changeHighLight.apply(_this, [$(this), true]);

                _this.dom_button_now_flag.css({ "display": "block" }).appendTo($(this));

                _this.styleArea_resetStyle.apply(_this);
            });

            // rect
            _this.dom_button_rect.on("click", function() {
                _this.button_rect_handler.apply(_this);
            });

            // circle
            _this.dom_button_circle.on("click", function() {
                _this.button_circle_handler.apply(_this);
            });

            // pencil
            _this.dom_button_pencil.on("click", function() {
                _this.button_pencil_handler.apply(_this);
            });

            // undo
            _this.dom_button_undo.on("click", function() {
                _this.canvas_undo.apply(_this);
            });

            // redo
            _this.dom_button_redo.on("click", function() {
                _this.canvas_redo.apply(_this);
            });

            // 取消按钮
            _this.dom_button_cancel.on("click", function() {
                _this.button_resetStyle.apply(_this);
                _this.canvas_record = [];
                _this.canvas_record_now_index = -1;
                _this.close();
            });
        },

        // 按钮监听-矩形
        button_rect_handler: function() {
            var _this = this;
            _this.dom_image.css({
                "cursor": "crosshair"
            });

            _this.action = "rect";

            _this.styleArea_show.apply(_this, [_this.dom_button_rect]);
        },

        // 按钮监听-圆形
        button_circle_handler: function() {
            var _this = this;
            _this.dom_image.css({
                "cursor": "crosshair"
            });

            _this.action = "circle";

            _this.styleArea_show.apply(_this, [_this.dom_button_circle]);
        },

        // 按钮监听-铅笔
        button_pencil_handler: function() {
            var _this = this;
            _this.dom_image.css({
                "cursor": "crosshair"
            });

            _this.action = "pencil";

            _this.styleArea_show.apply(_this, [_this.dom_button_pencil]);
        },

        // 设置宽高和位置
        resize: function() {
            var _this = this;

            var resize_doms = function() {

                // 获得窗口尺寸
                _this.window_width_px = $(window).width();
                _this.window_height_px = $(window).height();

                // 计算图片li盒的margin
                _this.li_marginTop_px = _this.window_height_px * (1 - _this.image_size_percent_from_window_height) / 2;
                _this.li_marginLeft_px = _this.window_width_px * (1 - _this.image_size_percent_from_window_width) / 2;

                // 计算图片li盒的宽度（含margin-left）
                _this.li_width_px = _this.window_width_px * _this.image_size_percent_from_window_width;
                _this.li_item_width_px = _this.li_width_px + _this.li_marginLeft_px;

                // 计算图片li盒的高度
                _this.li_height_px = _this.window_height_px * _this.image_size_percent_from_window_height;

                // 背景层
                _this.dom_bg_layer.css({
                    // "width": _this.window_width_px + "px",
                    // "height": _this.window_height_px + "px",
                    "width": "100%",
                    "height": "100%",
                    "background": _this.Paras.bg_color,
                    "z-index": _this.Paras.z_index
                });

                // 图片层
                _this.dom_image_box.css({
                    "width": _this.window_width_px + "px",
                    "height": _this.window_height_px + "px",
                    "z-index": _this.Paras.z_index + 1
                });

                // 图片ul盒
                _this.dom_image_ul.css({
                    "width": _this.window_width_px + "px",
                    "height": _this.window_height_px + "px",
                    "top": 0,
                    "left": 0
                });

                // 图片li盒
                _this.dom_image_li.css({
                    "width": _this.li_width_px + "px",
                    "height": (_this.li_height_px - _this.button_height_px * 1.2) + "px",
                    "margin-top": _this.li_marginTop_px + "px",
                    "margin-left": _this.li_marginLeft_px + "px"
                });

                // 图片盒
                if (_this.img_obj) {

                    // 计算图片应显示尺寸
                    var img_size = _this.img_size = _this.imageGetSize.apply(_this, [_this.img_obj]);

                    debug.debug(`ImageMarkPen 231: img_height=${img_size.img_height}; button_height_px=${_this.button_height_px}`);

                    // img_size.img_height -= _this.button_height_px * 1.5;

                    debug.debug(`ImageMarkPen 235: img_height=${img_size.img_height}`);

                    _this.dom_image.attr("width", img_size.img_width)
                        .attr("height", img_size.img_height)
                        .css({
                            // "width": img_size.img_width + "px",
                            // "height": img_size.img_height + "px",
                            "margin-top": -img_size.img_height / 2 + "px",
                            "margin-left": -img_size.img_width / 2 + "px"
                        });

                    debug.debug(`ImageMarkPen 470:`);
                    debug.debug(_this.ctx);

                    if (_this.ctx) {
                        _this.canvas_add("clearRect", {
                            "x": 0,
                            "y": 0,
                            "width": img_size.img_width,
                            "height": img_size.img_height
                        });
                        _this.canvas_record_now_index = -1;
                        _this.canvas_record = [];
                    } else
                        _this.ctx = _this.dom_image[0].getContext("2d");

                    debug.debug(`ImageMarkPen 480: _this.ctx=${_this.ctx}; _this.img_obj=${_this.img_obj}`);
                    setTimeout(function() {
                        _this.canvas_add("drawImage", {
                            "img": _this.img_obj,
                            "x": 0,
                            "y": 0,
                            "width": img_size.img_width,
                            "height": img_size.img_height
                        });
                    }, 0);
                    // 按钮盒
                    _this.dom_button_li.css({
                        "width": img_size.img_width < _this.button_box_minWidth_px ? _this.button_box_minWidth_px : img_size.img_width + "px",
                        "margin-top": _this.button_height_px / 5 + "px"
                    });
                }
            };

            resize_doms();

            // 监听窗口resize
            var resize_n = 0;
            var resize_do = function() {
                if (++resize_n > 1)
                    return;
                if (_this.dom_bg_layer.width() !== 0) {
                    setTimeout(function() {
                        resize_doms();
                        resize_n = 0;
                    }, 0);
                }
            };
            // $(window).unbind("resize", resize_do).bind("resize", resize_do);

        },

        // 显示弹层
        /*
            opt = {
                z_index: 弹层的z-index。图片/图文内容层为z_index+1。默认400
                bg_color: 背景层16进制颜色。默认#000000
                bg_opacity: 背景层透明度，0～1。默认0.8
                showKind: 1-图片 | 2-HTML。默认1
                Pics: showKind=1时有效。图片路径列表，数组。如 ["/images/001.jpg","/images/002.png"]。无默认值
                Pics_scroll_speed: showKind=1时有效。图片切换时的速度。毫秒。默认500。移动端建议设置为100-200，过慢会有卡顿的现象
                Pics_arrow_left: showKind=1时有效。图片切换 左箭头图片路径。默认/inc/LayerShow_arrow_left.png。
                Pics_arrow_right: showKind=1时有效。图片切换 右箭头图片路径。默认/inc/LayerShow_arrow_left.png。
                Pics_scale_fit: showKind=1且非ie678时有效。图片自动缩小到适配尺寸。true(默认)-无论图片多大，都可以全屏显示完整，不监听拖拽事件；false-图片原尺寸显示，拖拽时可改变显示位置(类似图片放大镜的效果)
                Pics_preload_all: showKind=1时有效。图片预加载所有大图，移动端建议false(以免图片加载太多影响打开)，pc端建议true(ie不支持svg)。默认true。
                callback_image_click: showKind=1时有效。图片点击回调：1-关闭弹层 | 2-下一张图片 | function(li_obj)-自定义方法。默认"1"
                info_content: showKind=2时有效，装载内容。无默认
                info_box_width_per: showKind=2时有效，内容盒宽度百分比。默认80
                info_box_height_per: showKind=2时有效，内容盒高度百分比。默认90
                info_box_radius: showKind=2时有效，内容盒是否圆角。默认true
                info_box_bg: showKind=2时有效，内容盒背景。默认"#ffffff"
                info_box_padding_px: showKind=2时有效，内容盒padding。默认20
                info_box_fontSize: showKind=2时有效，内容盒字体大小。默认"14px"
                info_box_fontColor: showKind=2时有效，内容盒字体颜色。默认"_this.button_color_default"
                info_box_lineHeight: showKind=2时有效，内容盒行间距。默认"30px"
                info_box_use_JRoll: showKind=2时有效，内容盒使用JRoll滚动（建议移动端使用，web端不用。IE7、8不兼容）如使用，则需要依赖或引用jroll.js。默认true
                JRoll_obj: JRoll对象。不使用JRoll做内容盒滚动，可不传。
                info_bottom_fixed_content: showKind=2时有效，底部固定层内容。无默认。
                info_bottom_fixed_height: showKind=2 && info_bottom_fixed_content!="" 时有效，高度，单位px。默认40
                Pics_close_show: true/false。显示关闭按钮。默认true
                Pics_close_path: 关闭按钮图片路径。默认/inc/LayerShow_close.png。
                callback_before: 弹层前回调。如显示loading层。无默认
                callback_success: 弹层成功回调。如关闭loading层。无默认
                callback_close(info_wrapper_html): 关闭弹层后的回调。info_wrapper_html为showKind=2时，$("#info_wrapper").html()。无默认
            }
        */
        show: function(opt) {
            var _this = this;

            var opt_default = {
                z_index: 400,
                bg_color: "#000",
                bg_opacity: 0.8,
                showKind: 1,
                Pics: [],
                Pics_show_index: 3,
                Pics_scroll_speed: 500,
                Pics_arrow_left: "/inc/LayerShow_arrow_left.png",
                Pics_arrow_right: "/inc/LayerShow_arrow_right.png",
                Pics_scale_fit: true,
                Pics_preload_all: true,
                callback_image_click: 1,
                info_box_width_per: 80,
                info_box_height_per: 90,
                info_box_radius: true,
                info_box_bg: "#fff",
                info_box_padding_px: 20,
                info_box_fontSize: "14px",
                info_box_fontColor: "_this.button_color_default",
                info_box_lineHeight: "30px",
                info_box_use_JRoll: true,
                info_bottom_fixed_height: 40,
                Pics_close_show: true,
                Pics_close_path: "/inc/LayerShow_close.png"
            };

            _this.Paras = $.extend(opt_default, opt);

            // 看有没有创建dom
            if (!_this.dom_bg_layer)
                _this.create_dom.apply(_this);

            // 执行弹层前回调
            if (_this.Paras.callback_before)
                _this.Paras.callback_before();

            // 装载图片
            if (_this.Paras.Pics[0] !== "") {

                // 图片加载成功后的回调（获得图片组中显示大小）
                _this.imageLoaded_success = function($img) {

                    _this.img_obj = $img;

                    // 设置弹层宽高和位置
                    _this.resize.apply(_this, [$img]);

                    // 显示弹层
                    if (_this.dom_bg_layer.css("opacity") === "0") {
                        _this.dom_bg_layer.fadeTo(200, _this.Paras.bg_opacity);
                        _this.dom_image_box.fadeIn(200, function() {
                            if (_this.Paras.callback_success)
                                _this.Paras.callback_success();
                            _this.ImageDrawLisenter.apply(_this);
                        });
                    }
                };

                // 加载图片。回调中显示弹层
                _this.imageLoad.apply(_this, [_this.Paras.Pics[0], function($img) {
                    _this.imageLoaded_success($img);
                }]);
            }

        },

        // 图片的监听
        ImageDrawLisenter: function() {
            var _this = this;

            var startPos = { x: -1, y: -1 };
            var nowPos = { x: -1, y: -1 };
            _this.dom_image.unbind("mousedown").on("mousedown", function(e) {
                startPos = {
                    x: e.offsetX,
                    y: e.offsetY
                };
                debug.debug(`ImageMarkPen 727`);
                debug.debug(e);

                // 没用，为了下面先undo，后add
                _this.canvas_add.apply(_this, ["moveto", { x: 0, y: 0 }]);

                switch (_this.action) {
                    case "rect":
                    case "circle":
                        _this.dom_image.unbind("mouseover").on("mousemove", function(e) {
                            nowPos = {
                                x: e.offsetX,
                                y: e.offsetY
                            };
                            _this.canvas_undo.apply(_this);
                            _this.canvas_add.apply(_this, [_this.action, {
                                x: startPos.x,
                                y: startPos.y,
                                width: nowPos.x - startPos.x,
                                height: nowPos.y - startPos.y,
                                radius: Math.sqrt(Math.pow(nowPos.x - startPos.x, 2) + Math.pow(nowPos.y - startPos.y, 2))
                            }]);

                        });
                        break;
                    case "pencil":
                        _this.dom_image.unbind("mouseover").on("mousemove", function(e) {
                            newPos = {
                                x: e.offsetX,
                                y: e.offsetY
                            };
                            _this.canvas_undo.apply(_this);
                            _this.canvas_add.apply(_this, [_this.action, {
                                x: startPos.x,
                                y: startPos.y,
                                x_moveTo: newPos.x,
                                y_moveTo: newPos.y
                            }]);
                        });

                        break;
                    default:
                        break;

                }
            }).unbind("mouseup").on("mouseup", function() {
                _this.dom_image.unbind("mousemove");
                startPos = { x: -1, y: -1 };
            });
        },

        // 关闭弹层
        // reShow==true时重新显示弹层。用于IE678的resize
        close: function(reShow) {
            var _this = this;

            _this.dom_bg_layer.fadeTo(200, 0, function() {
                $(this).css({
                    "width": 0,
                    "height": 0
                });
            });

            if (_this.Paras.showKind == 1) {
                _this.dom_image_box.fadeOut(200, function() {

                    // 清空li
                    // _this.dom_image_ul.html("");

                    if (reShow) {
                        _this.show.apply(_this, [_this.Paras]);
                    } else if (_this.Paras.callback_close)
                        _this.Paras.callback_close();
                });
            }
        },
        // 图片加载
        // function(img)
        imageLoad: function(picPath, callback) {
            var img = new Image();
            img.src = picPath;
            var _callback = function() {
                if (callback)
                    callback(img);
            };
            if (img.width)
                _callback();
            else {
                img.onload = function() {
                    _callback();
                };
            }

        },
        // 根据图片和显示盒的宽高，计算图片最终显示大小
        // box_size{width:0,height:0}为显示盒的宽高，如图片大于此宽高尺寸，则缩放。
        // box_size 默认为{width: _this.window_width_px * _this.image_size_percent_from_window_width, height: _this.window_height_px * _this.image_size_percent_from_window_height}
        imageGetSize: function(img, box_size) {
            var _this = this;

            _this.window_width_px = $(window).width();
            _this.window_height_px = $(window).height();

            // 获得图片盒尺寸
            if (!box_size)
                box_size = {
                    width: _this.window_width_px * _this.image_size_percent_from_window_width,
                    height: _this.window_height_px * _this.image_size_percent_from_window_height
                };

            // 获得图片的宽、高、宽高比
            var img_width_px = img.width;
            var img_height_px = img.height;
            var img_ratio = img_width_px / img_height_px;

            // 如果不需要缩小图片显示，则返回图片原尺寸(Paras.Pics_scale_fit)
            if (!_this.Paras.Pics_scale_fit) {
                return {
                    img_width: img_width_px,
                    img_height: img_height_px,
                    box_width: box_size.width,
                    box_height: box_size.height
                };
            }

            // 获得容器的宽高比
            var box_ratio = box_size.width / box_size.height;

            // 根据宽高比，决定最后图片的宽、高
            if (img_ratio <= box_ratio && img_height_px > box_size.height) {
                img_height_px = box_size.height;
                img_width_px = img_height_px * img_ratio;
            } else if (img_ratio >= box_ratio && img_width_px > box_size.width) {
                img_width_px = box_size.width;
                img_height_px = img_width_px / img_ratio;
            }

            return {
                img_width: img_width_px,
                img_height: img_height_px,
                box_width: box_size.width,
                box_height: box_size.height
            };
        }
    };
}

const isIE678 = () => {
    var yes = false;
    var browser = navigator.appName;
    if (browser == "Microsoft Internet Explorer") {
        var b_version = navigator.appVersion;
        var version = b_version.split(";");
        var trim_Version = version[1].replace(/[ ]/g, "");
        if (trim_Version == "MSIE6.0" || trim_Version == "MSIE7.0" || trim_Version == "MSIE8.0") {
            yes = true;
        }
    }
    return yes;
};

const debug = {
    _Debuging: true,
    log: (message) => {
        if (debug._Debuging === true)
            console.log(message);
    },
    warn: (message) => {
        if (debug._Debuging === true)
            console.warn(message);
    },
    error: (message) => {
        if (debug._Debuging === true)
            console.error(message);
    },
    debug: (message) => {
        if (debug._Debuging === true)
            console.debug(message);
    }
};

if (typeof define === "function" && define.amd) {
    define(function() {
        return ImageMarkPen;
    });
}