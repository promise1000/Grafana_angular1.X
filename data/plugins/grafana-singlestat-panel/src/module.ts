// 当前值，最大值，最小值，阈值，单位，小数点的位数，要从后台获取

///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import angular from 'angular';
import _ from 'lodash';
import $ from 'jquery';
import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import TimeSeries from 'app/core/time_series2';
import { MetricsPanelCtrl, loadPluginCss } from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/singlestat_ec/css/custom.css',
});


class SingleStatCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';
    
  dataType = 'timeseries';
  series: any[];
  data: any;
  fontSizes: any[];
  unitFormats: any[];
  
  invalidGaugeRange: boolean;
  panel: any;
  events: any;
  valueNameOptions: any[] = [
    { value: 'min', text: 'Min' },
    { value: 'max', text: 'Max' },
    { value: 'avg', text: 'Average' },
    { value: 'current', text: 'Current' },
    { value: 'total', text: 'Total' },
    { value: 'name', text: 'Name' },
    { value: 'first', text: 'First' },
    { value: 'delta', text: 'Delta' },
    { value: 'diff', text: 'Difference' },
    { value: 'range', text: 'Range' },
    { value: 'last_time', text: 'Time of last point' },
  ];
  tableColumnOptions: any;

  // Set and populate defaults
  panelDefaults = {
    links: [],
    datasource: null,
    maxDataPoints: 100,
    interval: null,
    targets: [{}],
    cacheTimeout: null,
    format: 'none',
    prefix: '',
    postfix: '',
    decimals: 0,//
    prefixColor:'#0cc90c',//
    postfixColor:'#0cc90c',//
    seriesIndex: 'A',
    nullText: null,
    valueMaps: [{ value: 'null', op: '=', text: 'N/A' }],
    mappingTypes: [{ name: 'value to text', value: 1 }, { name: 'range to text', value: 2 }],
    rangeMaps: [{ from: 'null', to: 'null', text: 'N/A' }],
    mappingType: 1,
    nullPointMode: 'connected',
    valueName: 'avg',

    prefixFontSize: '50%',
    valueFontSize: '50%',
    postfixFontSize: '50%',

    thresholds: '',
    colorBackground: false,
    colorValue: false,
    colors: ['#0cc90c', '#ffb700', '#ff231e'],
    sparkline: {
      show: false,
      full: false,
      lineColor: 'rgb(31, 120, 193)',
      fillColor: 'rgba(31, 118, 189, 0.18)',
      seriesIndex: 'A'
    },
    gauge: {
      show: false,
      minValue: 0,
      maxValue: 100,
      thresholdMarkers: true,
      thresholdLabels: false,
      color: '#ba43a9'
    },
    tableColumn: '',
    // 前缀的位置
    prefixLocations: ['left','top','right','bottom'],
    preLocation: 'left',
    // 后缀的位置
    postfixLocations: ['left','top','right','bottom'],
    postLocation: 'right'
  };

  /** @ngInject */
  constructor($scope, $injector, private linkSrv) {
    super($scope, $injector);
    _.defaults(this.panel, this.panelDefaults);

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));

    this.onSparklineColorChange = this.onSparklineColorChange.bind(this);
    this.onSparklineFillChange = this.onSparklineFillChange.bind(this);
  }
// 初始化编辑的模块（字体，option和value mappings，单位）
  onInitEditMode() {
    this.fontSizes = ['20%', '30%', '50%', '70%', '80%', '100%', '120%', '140%', '160%', '180%', '200%','220%'];
    this.addEditorTab('Options', 'public/plugins/singlestat_ec/editor.html', 2);
    this.addEditorTab('Value Mappings', 'public/plugins/singlestat_ec/mappings.html', 3);
    this.unitFormats = kbn.getUnitFormats();
  }
// 设置单位
  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.refresh();
  }
// 错误数据提示
  onDataError(err) {
    this.onDataReceived([]);
  }
// 在metrics设置里面的选择timeseries展示还是选择table展示
  onDataReceived(dataList) {
    const data: any = {};
    if (dataList.length > 0 && dataList[0].type === 'table') {
      this.dataType = 'table';
      const tableData = dataList.map(this.tableHandler.bind(this));
      this.setTableValues(tableData, data);
    } else {
      this.dataType = 'timeseries';
      this.series = dataList.map(this.seriesHandler.bind(this));
      this.setValues(data);
    }
    this.data = data;
    this.render();
  }
// 选择timeseries设置
  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints || [],
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }
// 选择table设置
  tableHandler(tableData) {
    const datapoints = [];
    const columnNames = {};

    tableData.columns.forEach((column, columnIndex) => {
      columnNames[columnIndex] = column.text;
    });

    this.tableColumnOptions = columnNames;
    if (!_.find(tableData.columns, ['text', this.panel.tableColumn])) {
      this.setTableColumnToSensibleDefault(tableData);
    }

    tableData.rows.forEach(row => {
      const datapoint = {};

      row.forEach((value, columnIndex) => {
        const key = columnNames[columnIndex];
        datapoint[key] = value;
      });

      datapoints.push(datapoint);
    });

    return datapoints;
  }
// 选择table设置
  setTableColumnToSensibleDefault(tableData) {
    if (tableData.columns.length === 1) {
      this.panel.tableColumn = tableData.columns[0].text;
    } else {
      this.panel.tableColumn = _.find(tableData.columns, col => {
        return col.type !== 'time';
      }).text;
    }
  }
// 选择table设置
  setTableValues(tableData, data) {
    if (!tableData || tableData.length === 0) {
      return;
    }

    if (tableData[0].length === 0 || tableData[0][0][this.panel.tableColumn] === undefined) {
      return;
    }

    const datapoint = tableData[0][0];
    data.value = datapoint[this.panel.tableColumn];

    if (_.isString(data.value)) {
      data.valueFormatted = _.escape(data.value);
      data.value = 0;
      data.valueRounded = 0;
    } else {
      const decimalInfo = this.getDecimalsForValue(data.value);
      const formatFunc = kbn.valueFormats[this.panel.format];
      data.valueFormatted = formatFunc(
        datapoint[this.panel.tableColumn],
        decimalInfo.decimals,
        decimalInfo.scaledDecimals
      );
      data.valueRounded = kbn.roundValue(data.value, this.panel.decimals || 0);
    }

    this.setValueMapping(data);
  }
// 勾选了gauge之后改变前缀和后缀的字体大小设置
  // canChangeFontSize() {
  //   return this.panel.gauge.show;
  // }
// 改变颜色设置
  setColoring(options) {
    if (options.background) {
      this.panel.colorValue = false;
      this.panel.colors = ['rgba(71, 212, 59, 0.4)', 'rgba(245, 150, 40, 0.73)', 'rgba(225, 40, 40, 0.59)'];
    } else {
      this.panel.colorBackground = false;
      this.panel.colors = ['rgba(50, 172, 45, 0.97)', '#ffb700', '#ff231e'];
    }
    this.render();
  }
// 啥意思？
  invertColorOrder() {
    var tmp = this.panel.colors[0];
    this.panel.colors[0] = this.panel.colors[2];
    this.panel.colors[2] = tmp;
    this.render();
  }

// 颜色改变的函数
  onColorChange(panelColorIndex) {
    return color => {
      this.panel.colors[panelColorIndex] = color;
      this.render();
    };
  }
  // 生成随机色
  randomColor () { 
    return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice( - 6);
  }
  
// 设置火花线
  onSparklineColorChange(newColor) {
    this.panel.sparkline.lineColor = newColor;
    this.render();
  }
// 设置火花线的填充色
  onSparklineFillChange(newColor) {
    this.panel.sparkline.fillColor = newColor;
    this.render();
  }
// 设置小数点的位数
  getDecimalsForValue(value) {
    if (_.isNumber(this.panel.decimals)) {
      return { decimals: this.panel.decimals, scaledDecimals: null };
    }

    var delta = value / 2;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);

    var magn = Math.pow(10, -dec),
      norm = delta / magn, // norm is between 1.0 and 10.0
      size;

    if (norm < 1.5) {
      size = 1;
    } else if (norm < 3) {
      size = 2;
      // special case for 2.5, requires an extra decimal
      if (norm > 2.25) {
        size = 2.5;
        ++dec;
      }
    } else if (norm < 7.5) {
      size = 5;
    } else {
      size = 10;
    }

    size *= magn;

    // reduce starting decimals if not needed
    if (Math.floor(value) === value) {
      dec = 0;
    }

    var result: any = {};
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

    return result;
  }
// 设置后台的data
  setValues(data) {
    console.log(data);
    // 把后台的值赋值给前端变量
    this.panel.prefix =  data.prefix || ''
    this.panel.postfix =  data.postfix || ''
    this.panel.gauge.minValue =  data.minValue || 0
    this.panel.gauge.maxValue =  data.maxValue || 100
    this.panel.thresholds =  data.thresholds = '10,30,50'
    this.panel.decimals =  data.decimals || 0
    

    data.flotpairs = [];
    var bigValueIndex = 0;
    var sparklineIndex = bigValueIndex;
    var CHAR_CODE_A = 65;
    if (this.panel.seriesIndex) {
       bigValueIndex = this.panel.seriesIndex.charCodeAt() - CHAR_CODE_A;
       sparklineIndex = bigValueIndex;
       if (this.panel.sparkline.seriesIndex) {
         sparklineIndex = this.panel.sparkline.seriesIndex.charCodeAt() - CHAR_CODE_A;
       }
    }
    if (this.series.length > 1 && bigValueIndex === 0 && sparklineIndex === 0) {
      var error: any = new Error();
      error.message = 'Multiple Series Error';
      error.data =
        'Metric query returns ' +
        this.series.length +
            ' series. Single Stat Panel expects a single series when series setting is empty or A.\n\nResponse:\n' +
	    JSON.stringify(this.series);
      throw error;
    }
    if (this.series.length !== 2 && (bigValueIndex > 0 || sparklineIndex > 0)) {
      var error: any = new Error();
      error.message = 'Number of Serieses Error';
      error.data = 'Metric query returns ' + this.series.length +
	    ' series. Single Stat Panel expects two serieses when one of series settings is B.\n\nResponse:\n' +
	    JSON.stringify(this.series);
      throw error;
    }

    if (this.series && this.series.length > 0) {
      let lastPoint = _.last(this.series[bigValueIndex].datapoints);
      let lastValue = _.isArray(lastPoint) ? lastPoint[bigValueIndex] : null;

      if (this.panel.valueName === 'name') {
        data.value = 0;
        data.valueRounded = 0;
        data.valueFormatted = this.series[0].alias;
      } else if (_.isString(lastValue)) {
        data.value = 0;
        data.valueFormatted = _.escape(lastValue);
        data.valueRounded = 0;
      } else if (this.panel.valueName === 'last_time') {
        let formatFunc = kbn.valueFormats[this.panel.format];
        data.value = lastPoint[1];
        data.valueRounded = data.value;
        // 从平台上新增9月3日
        // data.valueFormatted = formatFunc(data.value, 0, 0);
        data.valueFormatted = formatFunc(data.value, this.dashboard.isTimezoneUtc());
      } else {
        // 从平台上新增9月3日
        // data.value = this.series[0].stats[this.panel.valueName];
        // data.flotpairs = this.series[0].flotpairs;
        data.value = this.series[bigValueIndex].stats[this.panel.valueName];
        data.flotpairs = this.series[sparklineIndex].flotpairs;

        let decimalInfo = this.getDecimalsForValue(data.value);
        let formatFunc = kbn.valueFormats[this.panel.format];
        data.valueFormatted = formatFunc(data.value, decimalInfo.decimals, decimalInfo.scaledDecimals);
        data.valueRounded = kbn.roundValue(data.value, decimalInfo.decimals);
      }

      // Add $__name variable for using in prefix or postfix
      data.scopedVars = _.extend({}, this.panel.scopedVars);
      data.scopedVars['__name'] = { value: this.series[0].label };
    }
    this.setValueMapping(data);
  }
// 下面是设置Value Mappings
  setValueMapping(data) {
    // check value to text mappings if its enabled
    if (this.panel.mappingType === 1) {
      for (let i = 0; i < this.panel.valueMaps.length; i++) {
        let map = this.panel.valueMaps[i];
        // special null case
        if (map.value === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = map.text;
            return;
          }
          continue;
        }

        // value/number to text mapping
        var value = parseFloat(map.value);
        if (value === data.valueRounded) {
          data.valueFormatted = map.text;
          return;
        }
      }
    } else if (this.panel.mappingType === 2) {
      for (let i = 0; i < this.panel.rangeMaps.length; i++) {
        let map = this.panel.rangeMaps[i];
        // special null case
        if (map.from === 'null' && map.to === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = map.text;
            return;
          }
          continue;
        }

        // value/number to range mapping
        var from = parseFloat(map.from);
        var to = parseFloat(map.to);
        if (to >= data.valueRounded && from <= data.valueRounded) {
          data.valueFormatted = map.text;
          return;
        }
      }
    }

    if (data.value === null || data.value === void 0) {
      data.valueFormatted = 'no value';
    }
  }

  removeValueMap(map) {
    var index = _.indexOf(this.panel.valueMaps, map);
    this.panel.valueMaps.splice(index, 1);
    this.render();
  }

  addValueMap() {
    this.panel.valueMaps.push({ value: '', op: '=', text: '' });
  }

  removeRangeMap(rangeMap) {
    var index = _.indexOf(this.panel.rangeMaps, rangeMap);
    this.panel.rangeMaps.splice(index, 1);
    this.render();
  }

  addRangeMap() {
    this.panel.rangeMaps.push({ from: '', to: '', text: '' });
  }

  link(scope, elem, attrs, ctrl) {
    console.log(elem)
    var $location = this.$location;
    var linkSrv = this.linkSrv;
    var $timeout = this.$timeout;
    var panel = ctrl.panel;
    var templateSrv = this.templateSrv;
    var data, linkInfo;
    var $panelContainer = elem.find('.panel-container');
    elem = elem.find('.singlestat-panel');

    function applyColoringThresholds(value, valueString) {
      if (!panel.colorValue) {
        return valueString;
      }

      var color = getColorForValue(data, value);
      if (color) {
        return '<span style="color:' + color + '">' + valueString + '</span>';
      }

      return valueString;
    }

    function getSpan(className, fontSize, value) {
      value = templateSrv.replace(value, data.scopedVars);
      return '<span class="' + className + '" style="font-size:' + fontSize + '">' + value + '</span>';
    }
//
    function getBigValueHtml() {
      var body = '<div class="singlestat-panel-value-container">';
     
      if (panel.prefix) {
        // var prefix = applyColoringThresholds(data.value, panel.prefix);
        body += getSpan('singlestat-panel-prefix', panel.prefixFontSize,panel.prefix) ;
      }

      var value = applyColoringThresholds(data.value, data.valueFormatted);
      body += getSpan('singlestat-panel-value', panel.valueFontSize,value);

      if (panel.postfix) {
        // var postfix = applyColoringThresholds(data.value, panel.postfix);
        body += getSpan('singlestat-panel-postfix', panel.postfixFontSize, panel.postfix);
      }

      body += '</div>';

      return body;
    }

    function getValueText() {
      var result = panel.prefix ? templateSrv.replace(panel.prefix, data.scopedVars) : '';
      result += data.valueFormatted;
      result += panel.postfix ? templateSrv.replace(panel.postfix, data.scopedVars) : '';

      return result;
    }

//  设置勾选Gauge的函数
    function addGauge() {
      var width = elem.width();
      var height = elem.height();
      // Allow to use a bit more space for wide gauges
      // 尺寸
      // 
      var dimension = Math.min(width, height * 1.3);

      ctrl.invalidGaugeRange = false;
      if (panel.gauge.minValue > panel.gauge.maxValue) {
        ctrl.invalidGaugeRange = true;
        return;
      }

      var plotCanvas = $('<div></div>');
      var plotCss = {
        top: '10px',
        margin: 'auto',
        position: 'relative',
        height: height * 0.9 + 'px',
        width: dimension + 'px',
      };

      plotCanvas.css(plotCss);

      var thresholds = [];
      for (var i = 0; i < data.thresholds.length; i++) {
        thresholds.push({
          value: data.thresholds[i],
          color: data.colorMap[i],
        });
      }
      thresholds.push({
        value: panel.gauge.maxValue,
        color: data.colorMap[data.colorMap.length - 1],
      });
      var bgColor = config.bootData.user.lightTheme ? 'rgb(230,230,230)' : 'rgb(38,38,38)';
      // 从平台上新增9月3日
      var fontScale;
      var fontSize;
      if (panel.valueFontSize.indexOf('vw')>-1) {
        fontScale = parseInt(panel.valueFontSize) / 85;
        fontSize = Math.min(dimension / 5, 85) * fontScale;
      } else {
        fontScale = parseInt(panel.valueFontSize) / 100;
        fontSize = Math.min(dimension / 5, 100) * fontScale;
      }

      // var fontScale = parseInt(panel.valueFontSize) / 100;
      // var fontSize = Math.min(dimension / 5, 100) * fontScale;

      // Reduce gauge width if threshold labels enabled
      var gaugeWidthReduceRatio = panel.gauge.thresholdLabels ? 1.5 : 1;
      var gaugeWidth = Math.min(dimension / 6, 60) / gaugeWidthReduceRatio;
      var thresholdMarkersWidth = gaugeWidth / 5;
      var thresholdLabelFontSize = fontSize / 2.5;
      var options = {
        series: {
          gauges: {
            gauge: {
              min: panel.gauge.minValue, 
              max: panel.gauge.maxValue,
              background: { color: bgColor },
              border: { color: null },
              shadow: { show: false },
              width: gaugeWidth,
            },
            frame: { show: false },
            label: { show: false },
            layout: { margin: 0, thresholdWidth: 0 },
            cell: { border: { width: 0 } },
            threshold: {
              values: thresholds,
              label: {
                show: panel.gauge.thresholdLabels,
                margin: thresholdMarkersWidth + 1,
                font: { size: thresholdLabelFontSize },
                // 设置label的外圈的数字大小
                color: panel.gauge.color
              },
              show: panel.gauge.thresholdMarkers,
              width: thresholdMarkersWidth,
            },
            // value: {
            //   color: panel.colorValue ? getColorForValue(data, data.valueRounded) : null,
            //   formatter: function() {
            //     return getValueText();
            //   },
            //   font: {
            //     size: fontSize,
            //     family: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            //   },
            // },
            value:{},
            show: true,
          },
        },
      };

      elem.append(plotCanvas);

      var plotSeries = {
        data: [[0, data.valueRounded]],
      };
      console.log($('#flotGagueValue0'))
      $.plot(plotCanvas, [plotSeries], options);
      $('#flotGagueValue0').html('<span style="color:'+panel.prefixColor+' ;font-size:'+panel.prefixFontSize+'" class="'+panel.preLocation+'" >'+panel.prefix+'</span><span style="color:'+getColorForValue(data, data.valueRounded)+';font-size:'+fontSize+'px">'+(+data.valueFormatted).toFixed(panel.decimals)+'</span><span style="color:'+panel.postfixColor+' ;font-size:'+panel.postfixFontSize+'" class="'+panel.postLocation+'">'+panel.postfix+'</span>')
     
    }

// 添加火花线设置
    function addSparkline() {
      var width = elem.width() + 20;
      if (width < 30) {
        // element has not gotten it's width yet
        // delay sparkline render
        setTimeout(addSparkline, 30);
        return;
      }

      var height = ctrl.height;
      var plotCanvas = $('<div></div>');
      var plotCss: any = {};
      plotCss.position = 'absolute';

      if (panel.sparkline.full) {
        plotCss.bottom = '5px';
        plotCss.left = '-5px';
        plotCss.width = width - 10 + 'px';
        var dynamicHeightMargin = height <= 100 ? 5 : Math.round(height / 100) * 15 + 5;
        plotCss.height = height - dynamicHeightMargin + 'px';
      } else {
        plotCss.bottom = '0px';
        plotCss.left = '-5px';
        plotCss.width = width - 10 + 'px';
        plotCss.height = Math.floor(height * 0.25) + 'px';
      }

      plotCanvas.css(plotCss);

      var options = {
        legend: { show: false },
        series: {
          lines: {
            show: true,
            fill: 1,
            zero: false,
            lineWidth: 1,
            fillColor: panel.sparkline.fillColor,
          },
        },
        yaxes: { show: false },
        xaxis: {
          show: false,
          mode: 'time',
          min: ctrl.range.from.valueOf(),
          max: ctrl.range.to.valueOf(),
        },
        grid: { hoverable: false, show: false },
      };

      elem.append(plotCanvas);
      var plotSeries = {
        data: data.flotpairs,
        color: panel.sparkline.lineColor,
      };
      $.plot(plotCanvas, [plotSeries], options);
      
    }
    // 视图渲染函数 
    function render() {
      if (!ctrl.data) {
        return;
      }
      data = ctrl.data;

      // 从平台上新增9月3日
      // // get fontSizeValue
      // if (panel.adjustableFontSize) {
      //   panel.valueFontSize = panel.valueFontSizeVW;
      //   panel.prefixFontSize = panel.prefixFontSizeVW;
      //   panel.postfixFontSize = panel.postfixFontSizeVW;

      //   for (var item in ctrl.fontSizes) {
      //     if (ctrl.fontSizes[item].value === panel.valueFontSizeVW) {
      //       panel.valueFontSizePX = ctrl.fontSizes[item].px;
      //     }
      //     if (ctrl.fontSizes[item].value === panel.prefixFontSizeVW) {
      //       panel.prefixFontSizePX = ctrl.fontSizes[item].px;
      //     }
      //     if (ctrl.fontSizes[item].value === panel.postfixFontSizeVW) {
      //       panel.postfixFontSizePX = ctrl.fontSizes[item].px;
      //     }
      //   }
      // } else {
      //   panel.valueFontSize = panel.valueFontSizePX;
      //   panel.prefixFontSize = panel.prefixFontSizePX;
      //   panel.postfixFontSize = panel.postfixFontSizePX;

      //   for (item in ctrl.fontSizes) {
      //     if (ctrl.fontSizes[item].px === panel.valueFontSizePX) {
      //       panel.valueFontSizeVW = ctrl.fontSizes[item].value;
      //     }
      //     if (ctrl.fontSizes[item].px === panel.prefixFontSizePX) {
      //       panel.prefixFontSizeVW = ctrl.fontSizes[item].value;
      //     }
      //     if (ctrl.fontSizes[item].px === panel.postfixFontSizePX) {
      //       panel.postfixFontSizeVW = ctrl.fontSizes[item].value;
      //     }
      //   }
      // }

      // get thresholds
      data.thresholds = panel.thresholds.split(',').map(function(strVale) {
        return Number(strVale.trim());
      });

      data.colorMap = panel.colors;
      while (panel.colors.length < data.thresholds.length+1) {
        data.colorMap.push(ctrl.randomColor());
      }
      while (panel.colors.length > data.thresholds.length+1) {
        panel.colors.pop();
      }

      var body = panel.gauge.show ? '' : getBigValueHtml();

      if (panel.colorBackground) {
        var color = getColorForValue(data, data.value);
        if (color) {
          $panelContainer.css('background-color', color);
          if (scope.fullscreen) {
            elem.css('background-color', color);
          } else {
            elem.css('background-color', '');
          }
        }
      } else {
        $panelContainer.css('background-color', '');
        elem.css('background-color', '');
      }

      elem.html(body);

      if (panel.sparkline.show) {
        addSparkline();
      }

      if (panel.gauge.show) {
        addGauge();
        // // 从平台上新增9月3日
        // var panelValueFontSize = panel.valueFontSize;
        // var str = panelValueFontSize.substr(panelValueFontSize.length-2,2);
        // localStorage.setItem("singleStatFlag",str);
        // addGauge();
        // localStorage.setItem("singleStatFlag",null);
      }

      elem.toggleClass('pointer', panel.links.length > 0);

      if (panel.links.length > 0) {
        linkInfo = linkSrv.getPanelLinkAnchorInfo(panel.links[0], data.scopedVars);
      } else {
        linkInfo = null;
      }
    }
//  
    function hookupDrilldownLinkTooltip() {
      // drilldown link tooltip
      var drilldownTooltip = $('<div id="tooltip" class="">hello</div>"');

      elem.mouseleave(function() {
        if (panel.links.length === 0) {
          return;
        }
        $timeout(function() {
          drilldownTooltip.detach();
        });
      });

      elem.click(function(evt) {
        if (!linkInfo) {
          return;
        }
        // ignore title clicks in title
        if ($(evt).parents('.panel-header').length > 0) {
          return;
        }

        if (linkInfo.target === '_blank') {
          window.open(linkInfo.href, '_blank');
          return;
        }

        if (linkInfo.href.indexOf('http') === 0) {
          window.location.href = linkInfo.href;
        } else {
          $timeout(function() {
            $location.url(linkInfo.href);
          });
        }
	  
        drilldownTooltip.detach();
      });

      elem.mousemove(function(e) {
        if (!linkInfo) {
          return;
        }

        drilldownTooltip.text('click to go to: ' + linkInfo.title);
        drilldownTooltip.place_tt(e.pageX, e.pageY - 50);
      });
    }

    hookupDrilldownLinkTooltip();

    this.events.on('render', function() {
      render();
      ctrl.renderingCompleted();
    });
  }
}

// 获取的当前值设置颜色
function getColorForValue(data, value) {
  if (!_.isFinite(value)) {
    return null;
  }
// 阈值减少一个，颜色就减一个
  for (var i = data.thresholds.length; i > 0; i--) {
    if (value >= data.thresholds[i - 1]) {
      return data.colorMap[i];
    }
  }


  return _.first(data.colorMap);
}



export { SingleStatCtrl, SingleStatCtrl as PanelCtrl, getColorForValue };
