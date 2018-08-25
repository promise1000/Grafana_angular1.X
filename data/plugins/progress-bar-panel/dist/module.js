'use strict';

System.register(['./progressbar_ctrl', 'app/plugins/sdk'], function (_export, _context) {
  "use strict";

  var ProgressBarCtrl, loadPluginCss;
  return {
    setters: [function (_progressbar_ctrl) {
      ProgressBarCtrl = _progressbar_ctrl.ProgressBarCtrl;
    }, function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }],
    execute: function () {

      loadPluginCss({
        dark: 'plugins/progress-bar-panel/css/bar.css'
      });

      _export('PanelCtrl', ProgressBarCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
