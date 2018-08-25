import {ProgressBarCtrl} from './progressbar_ctrl';
import { loadPluginCss } from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/progress-bar-panel/css/bar.css',
});
export {
  ProgressBarCtrl as PanelCtrl
};

