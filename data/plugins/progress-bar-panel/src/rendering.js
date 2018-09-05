import _ from 'lodash';
import $ from 'jquery';
import 'jquery.flot';
import 'jquery.flot.pie';

// elem是ng-transclude组件bar的容器 ctrl是progressbar插件的实例
export default function link (scope, elem, attrs, ctrl) {
  var data, panel;
  elem = elem.find('.progressbar-panel');
  // 向ctrl实例注册render函数
  ctrl.events.on('render', function () {
    if (!ctrl.data) { return; }
    progressBar(ctrl);
  });

  function progressBar(ctrl) { 
    // ctrl里面返回的data就是[],后台返回的在response里面，这个ctrl.data是解析过的吧
    console.log('ctrl是啥',ctrl);
    // 获取bar的自适应高度
    var width = elem.width();
    var height = elem.height();
    var tagWidth = width*0.01768034*(ctrl.panel.SliderS.substring(0,ctrl.panel.SliderS.length-1)/100)
    console.log(width,height);
    var barHeight = width*0.0106082*(ctrl.panel.bH.substring(0,ctrl.panel.bH.length-1)/100);
    var shape = ctrl.panel.currentShape
    var tagStyle = shape==='triangle'
      ?('height:0;width:0;border-width:'+tagWidth+'px;border-top-color:'+ctrl.panel.sliderColor)
      :('height:'+tagWidth+'px;width:'+tagWidth+'px;background:'+ctrl.panel.sliderColor);
    // 拼bar容器标签
    var content = '<div class="bar-container" style="padding: 10px 27px;">';
    // data后台的相应值
    var data = ctrl.data;
    console.log('CtrlData是',ctrl.data)
    // 重复引用赋值(简化引用操作)
    var bars = ctrl.bars
     // 循环出来后台获取的值
     console.log("后台",data)
    for(let i=0;i<data.length;i++){
      var obj={};
      obj['decimals'] = data[i].decimal
      obj['thresholds'] = data[i].thresholds
      obj['label'] = ctrl.panel.barColor.slice(0,data[i].thresholds.split(',').length+2)
      obj['postfix'] = data[i].postfix
      obj['prefix'] = data[i].prefix
      obj['min'] = data[i].min
      obj['max'] = data[i].max 
      console.log('zhi',data[i].datapoints) 
      // obj['value'] = data[i].datapoints[0]
      // 
      // 
      // for(let item in data[i]){
      //   obj[item] = data[i].target
      // }
      bars[data[i].target]= obj
    }

    // bar文字大小
    var fontSize = ctrl.adjFontSize ? ctrl.fontSize : '0.8vw';
    // 循环bar对象
    for(var item in bars){
      // 获取节点值数组（barThresholds是每个bar的每个阈值）

      var barThresholds = bars[item].thresholds===""?[]:bars[item].thresholds.split(',');
      barThresholds.push(bars[item].max)
      // 关联阀值添加删除 bars[item].label = ctrl.panel.barColor.slice(0,barThresholds.length)
      barThresholds.length > bars[item].label.length && (bars[item].label.push(ctrl.randomColor()))
      barThresholds.length < bars[item].label.length && (bars[item].label.pop())
      // 获取tag数组(就是所有的颜色)
      var tag = bars[item].label;
      // 获取最大值和最小值
      var max = parseFloat(bars[item].max);
      var min = parseFloat(bars[item].min);
      // 拼接节段label
      content += '<div style="text-align:left; color:#ffffff; font-size:' + fontSize + '; display:inline-block; margin:19px 1px 1px 1px;">' + item + '&nbsp' + '</div>';
      content += '<div style="text-align:left; color:#ffffff; font-size:' + fontSize + '; display:inline-block; margin:19px 1px 1px 1px;">' + bars[item].prefix + ' ' + parseFloat(bars[item].value).toFixed(bars[item].decimals) + ' ' + bars[item].postfix + '</div>';
      content += '<div class="progress" style="width: 100%; height:' + barHeight + 'px;"><span class="tag-min">'+ min +'</span>';
      var lastPercent = 0; //记录最后的值的百分比
      for(var i in barThresholds){
        // 节段宽度计算(按滑块的百分比来计算)
        var thresholdValue = parseFloat(barThresholds[i]);
        var thresholdPercent= (thresholdValue-min)/(max-min)*100;
        var curPercent = thresholdPercent - lastPercent;
        content += '<div class="progress-bar" style="width: '+ curPercent + '%; height: ' + barHeight + 'px; background-color: ' + tag[i] + ';"><span class="tag-val">'+ barThresholds[i] +'</span></div>';
        lastPercent = thresholdPercent;
      } 
      // 获取滑块的位置
      var val = parseFloat(bars[item].value)
      var left = (val-min) / (max-min)*100; 
      var sharpPercent = tagWidth/2/width*100;
      left -= sharpPercent;
      content += '<span class="bar-tag ' + shape + '"style="left:'+left+'%;'+tagStyle+'"></span>'
      content += '</div>';
    }
    content += '</div>';
    elem.html(content);
  }
}
