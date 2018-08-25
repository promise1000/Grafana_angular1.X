import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import TimeSeries from 'app/core/time_series';
import rendering from './rendering';

export class ProgressBarCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.hiddenSeries = {};
    // panel的默认值
    var panelDefaults = {
      links: [],
      datasource: null,
      interval: null,
      targets: [{}],
      cacheTimeout: null,
      // 这是什么字段啊？连接的！
      nullPointMode: 'connected',
      aliasColors: {},
      format: 'short',
      valueName: 'current',
      strokeWidth: 1,
      fontSize: '80%',
      combine: {
        threshold: 0.0,
        label: 'Others'
      },
      middleFont: 15,
      colors: ['rgba(12, 201, 12, 0.9)', 'rgba(255, 183, 0, 0.89)', 'rgba(255, 35, 30, 0.97)'],
      dataPoint: [],
      adjFontSize: true,
      FontSize: '70%',
      bars: [{
        label: '',
        data: null,
        dataName: null,
        thresholdsValue: '30,60',
        thresholdstmp: [],
        minValue: 0,
        maxValue: 100,
        postfix: ' ',
        prefix: ' ',
      }],
      // bar config
      barHeight:['75%','100%','125%'],
      bH:'100%',
      shape: ['triangle','rectangle','circle'],
      currentShape: 'rectangle',
      SliderSize: ['75%','100%','125%'],
      SliderS:'100%',
      sliderColor:'rgba(12, 201, 12, 0.9)',
      // 给出固定的八个渐变的颜色
      barColor: ["rgba(12, 201, 12, 0.9)","rgba(255, 183, 0, 0.89)","rgba(255, 35, 30, 0.97)","rgb(255,85,0)","rgb(255,85,0)","rgb(114,160,193)","rgb(121,114,193)"]
    };
    // 初始化bar对象
    this.bars = {}
    this.bars['pH (0~14)'] = {
      label:["rgba(12, 201, 12, 0.9)","rgba(255, 183, 0, 0.89)","rgba(255, 35, 30, 0.97)"],
      max:"14",
      min:'0',
      prefix:" ",
      postfix:" ",
      thresholds:"6,8",
      value:'7.5',
      decimals: 2
    }
    this.bars['DO (0~50 mg/L)'] = {
        label:["rgba(12, 201, 12, 0.9)","rgba(255, 183, 0, 0.89)","rgba(255, 35, 30, 0.97)"],
        max:"75",
        min:'0',
        prefix:" ",
        postfix:"mg/L",
        thresholds:"25,50",
        value:'30',
        valueDecimals:" ",
        decimals: 2
      }
    this.datanames = {
      default: ''
    };
    this.adjFontSize = true;
    this.fontSize = '0.8vw';
    // this.fontSizes = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];
    this.fontCalc = [
      {
        text: '60%',
        value: '0.6vw'
      },
      {
        text: '70%',
        value: '0.8vw'
      },
      {
        text: '80%',
        value: '1vw'
      },
      {
        text: '100%',
        value: '1.4vw'
      },
      {
        text: '110%',
        value: '1.6vw'
      },
      {
        text: '120%',
        value: '1.8vw'
      },
      {
        text: '130%',
        value: '2vw'
      },
      {
        text: '140%',
        value: '2.2vw'
      },
      {
        text: '150%',
        value: '2.4vw'
      },
      {
        text: '160%',
        value: '2.6vw'
      },
      {
        text: '180%',
        value: '3vw'
      },
      {
        text: '200%',
        value: '3.4vw'
      },
      {
        text: '220%',
        value: '3.8vw'
      },
      {
        text: '230%',
        value: '4vw'
      },
    ];

    _.defaults(this.panel, panelDefaults);
    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }
  // 生成随机色
  randomColor () { 
    return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice( - 6);
  }
  onInitEditMode() {
    this.addEditorTab('WISE-PaaS', 'public/plugins/progress-bar-panel/SRP.html', 2);
    this.unitFormats = kbn.getUnitFormats();
  }

  onDataError() {
    this.series = [];
    this.render();
  }

  changeSeriesColor(series, color) {
    series.color = color;
    this.panel.aliasColors[series.alias] = series.color;
    this.render();
  }

  onRender() {
    this.data = this.parseSeries(this.series);
  }

  parseSeries(series) {
    return _.map(this.series, (serie, i) => {
      return {
        label: serie.alias,
        data: serie.stats[this.panel.valueName],
        color: this.panel.aliasColors[serie.alias] || this.$rootScope.colors[i]
      };
    });
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataReceived(dataList) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    this.data = this.parseSeries(this.series);
    this.panel.dataPoint = _.map(this.data, 'label').sort();
    this.render(this.data);
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  getDecimalsForValue(value) {
    if (_.isNumber(this.panel.decimals)) {
      return { decimals: this.panel.decimals, scaledDecimals: null };
    }

    var delta = value / 2;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);

    var magn = Math.pow(10, -dec);
    var norm = delta / magn; // norm is between 1.0 and 10.0
    var size;

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
    if (Math.floor(value) === value) { dec = 0; }

    var result = {};
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

    return result;
  }

  formatValue(value) {
    if (this.panel.format === 'short') {
      if (_.isNumber(this.panel.decimals)){
        return value.toFixed(this.panel.decimals)
      }else{
        return value
      }
    }
    var decimalInfo = this.getDecimalsForValue(value);
    var formatFunc = kbn.valueFormats[this.panel.format];
    if (formatFunc) {
      return formatFunc(value, decimalInfo.decimals, decimalInfo.scaledDecimals);
    }
    return value;
  }
  // 添加一个配置面板
  addBar(){
    // 生成随机串作为每个barsetting的唯一标识
    let randomStr = (Math.random().toString(36) + Math.random().toString(36).substring(2)).substr(2, Math.floor(Math.random() * (31 - 19) + 20))
    this.datanames[randomStr] = ''
    this.refresh();
  }
  // 移除一个配置面板
  removeBar(key){
   delete this.datanames[key]
   this.refresh();
  }

  link(scope, elem, attrs, ctrl) {
    // 导入的link函数，并调用
    rendering(scope, elem, attrs, ctrl);
  }

  toggleSeries(serie) {
    if (this.hiddenSeries[serie.label]) {
      delete this.hiddenSeries[serie.alias];
    } else {
      this.hiddenSeries[serie.label] = true;
    }
    this.render();
  }
}

ProgressBarCtrl.templateUrl = 'module.html';
